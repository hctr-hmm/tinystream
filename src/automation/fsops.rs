// SPDX-License-Identifier: AGPL-3.0-or-later

use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use anyhow::{Context, bail};
use serde::Serialize;
use sqlx::SqlitePool;

use crate::db::now;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Transfer {
    Hardlink,
    Copy,
    Move,
}

impl Transfer {
    pub fn as_str(self) -> &'static str {
        match self {
            Transfer::Hardlink => "hardlink",
            Transfer::Copy => "copy",
            Transfer::Move => "move",
        }
    }
}

pub struct Batch<'a> {
    db: &'a SqlitePool,
    pub id: String,
    label: String,
}

fn part_path(dst: &Path) -> PathBuf {
    let name = dst.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    dst.with_file_name(format!(".{name}.tinystream-part"))
}

impl<'a> Batch<'a> {
    pub fn new(db: &'a SqlitePool, id: impl Into<String>, label: impl Into<String>) -> Self {
        Self { db, id: id.into(), label: label.into() }
    }

    async fn record(&self, kind: &str, src: Option<&Path>, dst: &Path) -> anyhow::Result<()> {
        sqlx::query("INSERT INTO file_ops (batch, label, kind, src, dst, at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(&self.id)
            .bind(&self.label)
            .bind(kind)
            .bind(src.map(|p| p.to_string_lossy().to_string()))
            .bind(dst.to_string_lossy().to_string())
            .bind(now())
            .execute(self.db)
            .await?;
        Ok(())
    }

    pub async fn mkdirs(&self, dir: &Path) -> anyhow::Result<()> {
        let mut missing = Vec::new();
        let mut at = Some(dir);
        while let Some(d) = at {
            if d.exists() {
                break;
            }
            missing.push(d.to_path_buf());
            at = d.parent();
        }
        for d in missing.into_iter().rev() {
            std::fs::create_dir(&d).with_context(|| format!("can't create {}", d.display()))?;
            self.record("mkdir", None, &d).await?;
        }
        Ok(())
    }

    pub async fn rename(&self, src: &Path, dst: &Path) -> anyhow::Result<()> {
        if src == dst {
            return Ok(());
        }

        let same_file = dst.exists() && same_inode(src, dst);
        if dst.exists() && !same_file {
            bail!("{} already exists; not overwriting it", dst.display());
        }
        if let Some(parent) = dst.parent() {
            self.mkdirs(parent).await?;
        }
        move_file(src, dst).await?;
        self.record("rename", Some(src), dst).await
    }

    pub async fn transfer(&self, src: &Path, dst: &Path, how: &[Transfer]) -> anyhow::Result<Transfer> {
        if dst.exists() {
            bail!("{} already exists; not overwriting it", dst.display());
        }
        if let Some(parent) = dst.parent() {
            self.mkdirs(parent).await?;
        }
        let mut last_error = None;
        for &t in how {
            let result = match t {
                Transfer::Hardlink => std::fs::hard_link(src, dst).map_err(anyhow::Error::from),
                Transfer::Copy => copy_into_place(src, dst).await,
                Transfer::Move => move_file(src, dst).await,
            };
            match result {
                Ok(()) => {
                    self.record(t.as_str(), Some(src), dst).await?;
                    return Ok(t);
                },
                Err(e) => {
                    tracing::debug!("{} {} → {} didn't work: {e:#}", t.as_str(), src.display(), dst.display());
                    last_error = Some(e);
                },
            }
        }
        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("no way to import was allowed")))
            .with_context(|| format!("can't put {} into the library", src.display()))
    }
}

fn same_inode(a: &Path, b: &Path) -> bool {
    use std::os::unix::fs::MetadataExt;
    match (std::fs::metadata(a), std::fs::metadata(b)) {
        (Ok(a), Ok(b)) => a.ino() == b.ino() && a.dev() == b.dev(),
        _ => false,
    }
}

async fn copy_into_place(src: &Path, dst: &Path) -> anyhow::Result<()> {
    let part = part_path(dst);
    let (s, p) = (src.to_path_buf(), part.clone());

    let copied = tokio::task::spawn_blocking(move || std::fs::copy(&s, &p)).await?;
    if let Err(e) = copied {
        let _ = std::fs::remove_file(&part);
        return Err(e.into());
    }
    if dst.exists() {
        let _ = std::fs::remove_file(&part);
        bail!("{} appeared while copying; not overwriting it", dst.display());
    }
    std::fs::rename(&part, dst)?;
    Ok(())
}

async fn move_file(src: &Path, dst: &Path) -> anyhow::Result<()> {
    match std::fs::rename(src, dst) {
        Ok(()) => Ok(()),

        Err(e) if e.kind() == ErrorKind::CrossesDevices => {
            copy_into_place(src, dst).await?;
            std::fs::remove_file(src)?;
            Ok(())
        },
        Err(e) => Err(anyhow::Error::from(e).context(format!("can't move {} to {}", src.display(), dst.display()))),
    }
}

#[derive(Debug, Default, Serialize, async_graphql::SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct UndoReport {
    pub undone: usize,
    pub problems: Vec<String>,
}

pub async fn undo(db: &SqlitePool, batch: &str) -> anyhow::Result<UndoReport> {
    let ops: Vec<(i64, String, Option<String>, String)> = sqlx::query_as(
        "SELECT id, kind, src, dst FROM file_ops WHERE batch = ? AND undone_at IS NULL ORDER BY id DESC",
    )
    .bind(batch)
    .fetch_all(db)
    .await?;
    let mut report = UndoReport::default();
    for (id, kind, src, dst) in ops {
        let dst = PathBuf::from(dst);
        let result: anyhow::Result<()> = async {
            match kind.as_str() {
                "rename" | "move" => {
                    let src = PathBuf::from(src.context("no source recorded")?);
                    if src.exists() {
                        bail!("{} exists again; leaving {} where it is", src.display(), dst.display());
                    }
                    if !dst.exists() {
                        bail!("{} is gone", dst.display());
                    }
                    if let Some(parent) = src.parent() {
                        std::fs::create_dir_all(parent)?;
                    }
                    move_file(&dst, &src).await
                },
                "hardlink" | "copy" => {
                    if dst.exists() {
                        std::fs::remove_file(&dst)?;
                    }
                    Ok(())
                },
                "mkdir" => {
                    let _ = std::fs::remove_dir(&dst);
                    Ok(())
                },
                other => bail!("don't know how to undo {other:?}"),
            }
        }
        .await;
        match result {
            Ok(()) => {
                report.undone += 1;
                sqlx::query("UPDATE file_ops SET undone_at = ? WHERE id = ?").bind(now()).bind(id).execute(db).await?;
            },
            Err(e) => report.problems.push(format!("{e:#}")),
        }
    }
    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn db() -> SqlitePool {
        let dir = std::env::temp_dir().join(format!("ts-fsops-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        crate::db::open(&dir.join("t.db")).await.unwrap()
    }

    #[tokio::test]
    async fn rename_and_undo() {
        let db = db().await;
        let dir = std::env::temp_dir().join(format!("ts-fsops-files-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let a = dir.join("a.mkv");
        std::fs::write(&a, b"x").unwrap();
        let b = dir.join("Season 01/b.mkv");
        let batch = Batch::new(&db, "t1", "test");
        batch.rename(&a, &b).await.unwrap();
        assert!(b.exists() && !a.exists());

        std::fs::write(&a, b"y").unwrap();
        assert!(batch.rename(&a, &b).await.is_err());
        std::fs::remove_file(&a).unwrap();

        let report = undo(&db, "t1").await.unwrap();
        assert_eq!(report.undone, 2, "{:?}", report.problems);
        assert!(a.exists() && !dir.join("Season 01").exists());
    }

    #[tokio::test]
    async fn transfer_falls_back() {
        let db = db().await;
        let dir = std::env::temp_dir().join(format!("ts-fsops-files-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let src = dir.join("dl.mkv");
        std::fs::write(&src, b"data").unwrap();
        let batch = Batch::new(&db, "t2", "test");
        let how = batch.transfer(&src, &dir.join("lib/ep.mkv"), &[Transfer::Hardlink, Transfer::Copy]).await.unwrap();
        assert_eq!(how, Transfer::Hardlink);
        assert!(src.exists());
        assert!(batch.transfer(&src, &dir.join("lib/ep.mkv"), &[Transfer::Copy]).await.is_err());
    }
}
