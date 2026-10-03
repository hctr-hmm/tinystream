// SPDX-License-Identifier: AGPL-3.0-or-later

use serde::Serialize;
use tokio::sync::broadcast;

use crate::notifications::Notification;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum Event {
    ConfigChanged,
    ConfigError {
        message: String,
    },
    ScanStarted {
        library: String,
    },
    ScanFinished {
        library: String,
        items: usize,
        media: usize,
        skipped: usize,
    },
    LibraryChanged {
        library: String,
    },
    MetadataFetching {
        item_id: i64,
    },
    MetadataUpdated {
        item_id: i64,
    },
    MetadataFailed {
        item_id: i64,
    },
    DownloadsChanged,
    SeriesChanged {
        series_id: i64,
    },
    Imported {
        library: String,
        show: String,
        item_id: Option<i64>,
        episodes: Vec<(u32, u32)>,
    },
    RenamesChanged,
    RequestsChanged,
    UsersChanged,
    Notified {
        user_id: i64,
        notification: Notification,
    },
    NotificationsChanged {
        user_id: i64,
    },
    ClipChanged {
        clip_id: i64,
        users: Vec<i64>,
        state: String,
        progress: Option<f32>,
    },
    QueueChanged {
        user_id: i64,
        by: Option<String>,
    },
    PlaylistsChanged,
    /// Someone's own appearance, or everyone's when there's no `user_id`.
    AppearanceChanged {
        user_id: Option<i64>,
    },
}

#[derive(Clone)]
pub struct Events(broadcast::Sender<Event>);

impl Events {
    pub fn new() -> Self {
        Self(broadcast::channel(256).0)
    }

    pub fn send(&self, event: Event) {
        let _ = self.0.send(event);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<Event> {
        self.0.subscribe()
    }
}
