// SPDX-License-Identifier: AGPL-3.0-or-later

pub mod art;
pub mod catalog;
pub mod listen;
pub mod loudness;
pub mod lyrics;
pub mod queue;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use tokio::sync::OnceCell;

use crate::auth::User;
use crate::state::AppState;

#[derive(Default)]
pub struct Music {
    pub loudness: loudness::Analyzer,
    pub lyrics: lyrics::Fetches,
    pub playing: queue::NowPlaying,
    pub listen: Arc<listen::Rooms>,

    /// Lossless copies being made, so the same one isn't made twice at once.
    pub copies: Mutex<HashMap<PathBuf, Arc<OnceCell<Result<(), String>>>>>,

    /// Music apps' passwords that checked out lately, by a hash of them.
    pub logins: Mutex<HashMap<[u8; 32], (i64, Instant)>>,
}

/// The music libraries someone can see.
pub fn libraries(state: &AppState, user: &User) -> Vec<String> {
    state
        .config
        .current()
        .libraries
        .iter()
        .filter(|l| l.is_music() && user.permissions.can_see(&l.name))
        .map(|l| l.name.clone())
        .collect()
}

/// ReplayGain's reference loudness, which measured loudness is turned into gain against.
pub const REFERENCE_LUFS: f64 = -18.0;

pub fn gain_for(loudness: Option<f64>) -> Option<f64> {
    loudness.map(|l| ((REFERENCE_LUFS - l) * 100.0).round() / 100.0)
}

pub fn spawn(state: Arc<AppState>) {
    loudness::spawn(state.clone());
    state.music.listen.clone().spawn(state.db.clone());
}
