// SPDX-License-Identifier: AGPL-3.0-or-later

use std::path::{Path as FsPath, PathBuf};
use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use sha2::{Digest, Sha256};

use crate::auth::User;
use crate::error::{ApiError, ApiResult};
use crate::library::{BACKDROP_NAMES, POSTER_NAMES, local_art};
use crate::state::AppState;

const CACHE: &str = "public, max-age=604800, immutable";

async fn serve_file(path: &FsPath) -> ApiResult<Response> {
    let data = tokio::fs::read(path).await.map_err(|_| ApiError::not_found("image"))?;
    let mime = mime_guess::from_path(path).first_or_octet_stream().to_string();
    Ok(([(header::CONTENT_TYPE, mime), (header::CACHE_CONTROL, CACHE.into())], data).into_response())
}

async fn serve_remote(state: &AppState, url: &str) -> ApiResult<Response> {
    let dir = state.paths.cache_dir().join("images");
    let key = hex::encode(&Sha256::digest(url.as_bytes())[..16]);
    let ext = url.rsplit('.').next().filter(|e| e.len() <= 4).unwrap_or("jpg");
    let file: PathBuf = dir.join(format!("{key}.{ext}"));
    if !file.exists() {
        let res = state.http.get(url).send().await.and_then(|r| r.error_for_status()).map_err(|e| {
            tracing::debug!("image {url}: {e}");
            ApiError::not_found("image")
        })?;
        let bytes = res.bytes().await.map_err(|_| ApiError::not_found("image"))?;
        tokio::fs::create_dir_all(&dir).await.map_err(|e| ApiError::from(anyhow::anyhow!(e)))?;
        let tmp = file.with_extension("part");
        tokio::fs::write(&tmp, &bytes).await.map_err(|e| ApiError::from(anyhow::anyhow!(e)))?;
        tokio::fs::rename(&tmp, &file).await.map_err(|e| ApiError::from(anyhow::anyhow!(e)))?;
    }
    serve_file(&file).await
}

pub async fn item(
    State(state): State<Arc<AppState>>,
    user: User,
    Path((id, kind)): Path<(i64, String)>,
) -> ApiResult<Response> {
    let library: String = sqlx::query_scalar("SELECT library FROM items WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| ApiError::not_found("image"))?;
    user.can_access(&state, &library).await?;
    item_art(&state, id, &kind).await
}

pub(super) async fn item_art(state: &AppState, id: i64, kind: &str) -> ApiResult<Response> {
    let (path, poster, backdrop): (String, Option<String>, Option<String>) =
        sqlx::query_as("SELECT path, poster, backdrop FROM items WHERE id = ?")
            .bind(id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| ApiError::not_found("image"))?;
    let (names, remote) = match kind {
        "poster" => (POSTER_NAMES, poster),
        "backdrop" => (BACKDROP_NAMES, backdrop),
        _ => return Err(ApiError::not_found("image")),
    };
    if let Some(local) = local_art(FsPath::new(&path), names) {
        return serve_file(&local).await;
    }
    serve_remote(state, &remote.ok_or_else(|| ApiError::not_found("image"))?).await
}

pub async fn season(
    State(state): State<Arc<AppState>>,
    user: User,
    Path((id, number)): Path<(i64, i64)>,
) -> ApiResult<Response> {
    let (library, poster): (String, Option<String>) = sqlx::query_as(
        "SELECT i.library, s.poster FROM seasons s JOIN items i ON i.id = s.item_id WHERE s.item_id = ? AND s.number = ?",
    )
    .bind(id)
    .bind(number)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| ApiError::not_found("image"))?;
    user.can_access(&state, &library).await?;
    serve_remote(&state, &poster.ok_or_else(|| ApiError::not_found("image"))?).await
}

pub async fn still(State(state): State<Arc<AppState>>, user: User, Path(id): Path<i64>) -> ApiResult<Response> {
    let library: String =
        sqlx::query_scalar("SELECT i.library FROM media m JOIN items i ON i.id = m.item_id WHERE m.id = ?")
            .bind(id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| ApiError::not_found("image"))?;
    user.can_access(&state, &library).await?;
    episode_still(&state, id).await
}

pub(super) async fn episode_still(state: &AppState, id: i64) -> ApiResult<Response> {
    let (path, still): (String, Option<String>) = sqlx::query_as("SELECT path, still FROM media WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| ApiError::not_found("image"))?;
    let local = FsPath::new(&path).with_extension("jpg");
    if local.is_file() {
        return serve_file(&local).await;
    }
    if let Some(url) = still
        && let Ok(res) = serve_remote(state, &url).await
    {
        return Ok(res);
    }

    let thumb = state.media.thumbnail(FsPath::new(&path)).await.map_err(|e| {
        tracing::debug!("thumbnail for {path}: {e:#}");
        ApiError::not_found("image")
    })?;
    serve_file(&thumb).await
}
