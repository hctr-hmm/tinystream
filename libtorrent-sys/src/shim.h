// SPDX-License-Identifier: AGPL-3.0-or-later

#pragma once

#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>

#include "rust/cxx.h"

#include <libtorrent/session.hpp>
#include <libtorrent/torrent_handle.hpp>

namespace tinystream {

struct Settings;
struct AddParams;
struct Status;
struct FileEntry;
struct Event;

class Session {
public:
  explicit Session(const Settings &settings);
  ~Session();

  void apply_settings(const Settings &settings) const;
  void set_paused(bool paused) const;
  rust::String add(const AddParams &params) const;
  void remove(rust::Str hash, bool delete_files) const;
  void pause_torrent(rust::Str hash) const;
  void resume_torrent(rust::Str hash) const;
  void recheck(rust::Str hash) const;
  rust::Vec<Status> statuses() const;
  rust::Vec<FileEntry> files(rust::Str hash) const;
  void save_resume(rust::Str hash) const;
  rust::Vec<Event> poll() const;

private:
  lt::torrent_handle find(rust::Str hash) const;

  mutable lt::session session_;
  mutable std::mutex mutex_;
  mutable std::unordered_map<std::string, lt::torrent_handle> handles_;
};

std::unique_ptr<Session> new_session(const Settings &settings);
rust::String version();

} // namespace tinystream
