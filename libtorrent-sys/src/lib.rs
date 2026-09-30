// SPDX-License-Identifier: AGPL-3.0-or-later

use libtorrent_src as _;

#[cxx::bridge(namespace = "tinystream")]
pub mod ffi {

    #[derive(Debug, Clone, Default, PartialEq)]
    pub struct Settings {
        pub listen_interfaces: String,

        pub outgoing_interface: String,

        pub proxy_type: u8,
        pub proxy_host: String,
        pub proxy_port: u16,
        pub proxy_user: String,
        pub proxy_pass: String,

        pub download_rate_limit: i64,
        pub upload_rate_limit: i64,
        pub enable_upnp: bool,
        pub enable_natpmp: bool,
        pub enable_dht: bool,
        pub enable_lsd: bool,

        pub active_downloads: i32,
        pub active_seeds: i32,
        pub active_limit: i32,
        pub user_agent: String,
    }

    #[derive(Debug, Clone, Default)]
    pub struct AddParams {
        pub magnet: String,

        pub torrent: Vec<u8>,

        pub resume: Vec<u8>,
        pub save_path: String,
        pub paused: bool,
    }

    #[derive(Debug, Clone, Default)]
    pub struct Status {
        pub hash: String,
        pub name: String,

        pub state: u8,
        pub paused: bool,
        pub progress: f32,
        pub download_rate: i64,
        pub upload_rate: i64,
        pub total_done: i64,
        pub total_wanted: i64,
        pub all_time_upload: i64,
        pub all_time_download: i64,
        pub num_peers: i32,
        pub num_seeds: i32,
        pub seeding_seconds: i64,
        pub active_seconds: i64,

        pub last_upload_ago: i64,
        pub has_metadata: bool,
        pub error: String,
        pub save_path: String,
        pub need_save_resume: bool,

        pub pieces: Vec<u8>,
    }

    #[derive(Debug, Clone)]
    pub struct FileEntry {
        pub path: String,
        pub size: i64,
        pub done: i64,
    }

    #[derive(Debug, Clone)]
    pub struct Event {
        pub kind: u8,
        pub hash: String,
        pub message: String,
        pub data: Vec<u8>,
    }

    unsafe extern "C++" {
        include!("libtorrent-sys/src/shim.h");

        type Session;

        fn new_session(settings: &Settings) -> Result<UniquePtr<Session>>;
        fn apply_settings(self: &Session, settings: &Settings);

        fn set_paused(self: &Session, paused: bool);
        fn add(self: &Session, params: &AddParams) -> Result<String>;
        fn remove(self: &Session, hash: &str, delete_files: bool);
        fn pause_torrent(self: &Session, hash: &str);
        fn resume_torrent(self: &Session, hash: &str);
        fn recheck(self: &Session, hash: &str);
        fn statuses(self: &Session) -> Vec<Status>;
        fn files(self: &Session, hash: &str) -> Vec<FileEntry>;

        fn save_resume(self: &Session, hash: &str);
        fn poll(self: &Session) -> Vec<Event>;
        fn version() -> String;
    }
}

unsafe impl Send for ffi::Session {}
unsafe impl Sync for ffi::Session {}

pub use cxx::UniquePtr;
pub use ffi::*;
