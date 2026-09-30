// SPDX-License-Identifier: AGPL-3.0-or-later

pub mod parse;
pub mod scanner;

use std::path::{Path, PathBuf};

pub use scanner::Scanner;

const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp"];

pub fn local_art(dir: &Path, names: &[&str]) -> Option<PathBuf> {
    for name in names {
        for ext in IMAGE_EXTENSIONS {
            let p = dir.join(format!("{name}.{ext}"));
            if p.is_file() {
                return Some(p);
            }
        }
    }
    None
}

pub const POSTER_NAMES: &[&str] = &["poster", "folder", "cover"];
pub const BACKDROP_NAMES: &[&str] = &["backdrop", "fanart", "background"];
