// SPDX-License-Identifier: AGPL-3.0-or-later

#include "libtorrent-sys/src/shim.h"
#include "libtorrent-sys/src/lib.rs.h"

#include <algorithm>
#include <chrono>
#include <sstream>

#include <libtorrent/alert_types.hpp>
#include <libtorrent/magnet_uri.hpp>
#include <libtorrent/read_resume_data.hpp>
#include <libtorrent/session_params.hpp>
#include <libtorrent/torrent_info.hpp>
#include <libtorrent/torrent_status.hpp>
#include <libtorrent/version.hpp>
#include <libtorrent/write_resume_data.hpp>

namespace tinystream {

namespace {

// A torrent's identity. Always the v1 hash when there is one, so a magnet
// link and the metadata it resolves to agree even for hybrid torrents.
std::string key(const lt::info_hash_t &ih) {
  std::ostringstream ss;
  if (ih.has_v1())
    ss << ih.v1;
  else
    ss << ih.v2;
  return ss.str();
}

lt::settings_pack pack(const Settings &s) {
  using sp = lt::settings_pack;
  lt::settings_pack p;
  p.set_int(sp::alert_mask, static_cast<int>(static_cast<std::uint32_t>(
                                lt::alert_category::status | lt::alert_category::error |
                                lt::alert_category::storage)));
  if (!s.listen_interfaces.empty())
    p.set_str(sp::listen_interfaces, std::string(s.listen_interfaces));
  p.set_str(sp::outgoing_interfaces, std::string(s.outgoing_interface));

  int proxy = sp::none;
  bool auth = !s.proxy_user.empty();
  if (s.proxy_type == 1)
    proxy = auth ? sp::socks5_pw : sp::socks5;
  else if (s.proxy_type == 2)
    proxy = auth ? sp::http_pw : sp::http;
  p.set_int(sp::proxy_type, proxy);
  p.set_str(sp::proxy_hostname, std::string(s.proxy_host));
  p.set_int(sp::proxy_port, s.proxy_port);
  p.set_str(sp::proxy_username, std::string(s.proxy_user));
  p.set_str(sp::proxy_password, std::string(s.proxy_pass));
  // Shutting down waits for trackers to acknowledge "stopped"; that's only
  // a courtesy, so don't let it hold things up for the default 5s.
  p.set_int(sp::stop_tracker_timeout, 1);
  p.set_bool(sp::proxy_hostnames, true);
  p.set_bool(sp::proxy_peer_connections, true);
  p.set_bool(sp::proxy_tracker_connections, true);

  p.set_int(sp::download_rate_limit, static_cast<int>(s.download_rate_limit));
  p.set_int(sp::upload_rate_limit, static_cast<int>(s.upload_rate_limit));
  p.set_bool(sp::enable_upnp, s.enable_upnp);
  p.set_bool(sp::enable_natpmp, s.enable_natpmp);
  p.set_bool(sp::enable_dht, s.enable_dht);
  p.set_bool(sp::enable_lsd, s.enable_lsd);
  p.set_int(sp::active_downloads, s.active_downloads);
  p.set_int(sp::active_seeds, s.active_seeds);
  p.set_int(sp::active_limit, s.active_limit);
  if (!s.user_agent.empty())
    p.set_str(sp::user_agent, std::string(s.user_agent));
  return p;
}

Event event(std::uint8_t kind, std::string hash, std::string message) {
  Event e;
  e.kind = kind;
  e.hash = rust::String::lossy(hash);
  e.message = rust::String::lossy(message);
  return e;
}

} // namespace

Session::Session(const Settings &settings) : session_(lt::session_params(pack(settings))) {}

Session::~Session() = default;

std::unique_ptr<Session> new_session(const Settings &settings) {
  return std::make_unique<Session>(settings);
}

rust::String version() { return rust::String(LIBTORRENT_VERSION); }

void Session::apply_settings(const Settings &settings) const { session_.apply_settings(pack(settings)); }

void Session::set_paused(bool paused) const {
  if (paused)
    session_.pause();
  else
    session_.resume();
}

lt::torrent_handle Session::find(rust::Str hash) const {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = handles_.find(std::string(hash));
  return it == handles_.end() ? lt::torrent_handle() : it->second;
}

rust::String Session::add(const AddParams &params) const {
  lt::add_torrent_params p;
  if (!params.resume.empty()) {
    p = lt::read_resume_data(
        lt::span<char const>(reinterpret_cast<const char *>(params.resume.data()),
                             static_cast<std::ptrdiff_t>(params.resume.size())));
  } else if (!params.torrent.empty()) {
    p.ti = std::make_shared<lt::torrent_info>(
        lt::span<char const>(reinterpret_cast<const char *>(params.torrent.data()),
                             static_cast<std::ptrdiff_t>(params.torrent.size())),
        lt::from_span);
  } else {
    p = lt::parse_magnet_uri(std::string(params.magnet));
  }
  if (!params.save_path.empty())
    p.save_path = std::string(params.save_path);
  if (params.paused) {
    p.flags |= lt::torrent_flags::paused;
    p.flags &= ~lt::torrent_flags::auto_managed;
  }
  lt::torrent_handle h = session_.add_torrent(std::move(p));
  std::string k = key(h.info_hashes());
  {
    std::lock_guard<std::mutex> lock(mutex_);
    handles_[k] = h;
  }
  return rust::String(k);
}

void Session::remove(rust::Str hash, bool delete_files) const {
  auto h = find(hash);
  if (!h.is_valid())
    return;
  session_.remove_torrent(h, delete_files ? lt::session::delete_files : lt::remove_flags_t{});
  std::lock_guard<std::mutex> lock(mutex_);
  handles_.erase(std::string(hash));
}

void Session::pause_torrent(rust::Str hash) const {
  auto h = find(hash);
  if (!h.is_valid())
    return;
  h.unset_flags(lt::torrent_flags::auto_managed);
  h.pause(lt::torrent_handle::graceful_pause);
}

void Session::resume_torrent(rust::Str hash) const {
  auto h = find(hash);
  if (!h.is_valid())
    return;
  h.set_flags(lt::torrent_flags::auto_managed);
  h.resume();
}

void Session::recheck(rust::Str hash) const {
  auto h = find(hash);
  if (h.is_valid())
    h.force_recheck();
}

rust::Vec<Status> Session::statuses() const {
  rust::Vec<Status> out;
  auto list = session_.get_torrent_status([](const lt::torrent_status &) { return true; },
                                          lt::torrent_handle::query_name |
                                              lt::torrent_handle::query_save_path |
                                              lt::torrent_handle::query_pieces);
  auto now = lt::clock_type::now();
  for (const auto &st : list) {
    Status s;
    s.hash = rust::String(key(st.info_hashes));
    s.name = rust::String::lossy(st.name);
    s.state = static_cast<std::uint8_t>(st.state);
    s.paused = static_cast<bool>(st.flags & lt::torrent_flags::paused);
    s.progress = st.progress;
    // libtorrent's rates are a decaying average that trails off for a minute
    // after transfer stops (and freezes once paused), so report what's
    // actually possible rather than the tail.
    s.download_rate = s.paused || st.is_finished ? 0 : st.download_payload_rate;
    s.upload_rate = s.paused ? 0 : st.upload_payload_rate;
    s.total_done = st.total_wanted_done;
    s.total_wanted = st.total_wanted;
    s.all_time_upload = st.all_time_upload;
    s.all_time_download = st.all_time_download;
    s.num_peers = st.num_peers;
    s.num_seeds = st.num_seeds;
    s.seeding_seconds = st.seeding_duration.count();
    s.active_seconds = st.active_duration.count();
    s.last_upload_ago =
        st.last_upload == lt::time_point()
            ? -1
            : std::chrono::duration_cast<std::chrono::seconds>(now - st.last_upload).count();
    s.has_metadata = st.has_metadata;
    s.error = rust::String::lossy(st.errc ? st.errc.message() : std::string());
    s.save_path = rust::String::lossy(st.save_path);
    s.need_save_resume = st.need_save_resume;
    const int total = st.pieces.size();
    if (total > 0) {
      const int buckets = std::min(total, 128);
      for (int b = 0; b < buckets; ++b) {
        const int from = static_cast<int>(static_cast<long long>(b) * total / buckets);
        const int to = static_cast<int>(static_cast<long long>(b + 1) * total / buckets);
        int have = 0;
        for (int i = from; i < to; ++i)
          if (st.pieces.get_bit(lt::piece_index_t(i)))
            ++have;
        s.pieces.push_back(static_cast<std::uint8_t>(have * 255 / std::max(1, to - from)));
      }
    }
    out.push_back(std::move(s));
  }
  return out;
}

rust::Vec<FileEntry> Session::files(rust::Str hash) const {
  rust::Vec<FileEntry> out;
  auto h = find(hash);
  if (!h.is_valid())
    return out;
  auto ti = h.torrent_file();
  if (!ti)
    return out;
  std::vector<std::int64_t> progress;
  h.file_progress(progress, lt::torrent_handle::piece_granularity);
  const auto &fs = ti->files();
  for (lt::file_index_t i : fs.file_range()) {
    if (fs.pad_file_at(i))
      continue;
    auto idx = static_cast<std::size_t>(static_cast<int>(i));
    FileEntry f{rust::String::lossy(fs.file_path(i)), fs.file_size(i),
                idx < progress.size() ? progress[idx] : 0};
    out.push_back(std::move(f));
  }
  return out;
}

void Session::save_resume(rust::Str hash) const {
  auto h = find(hash);
  if (h.is_valid())
    h.save_resume_data(lt::torrent_handle::save_info_dict);
}

rust::Vec<Event> Session::poll() const {
  rust::Vec<Event> out;
  std::vector<lt::alert *> alerts;
  session_.pop_alerts(&alerts);
  for (lt::alert *a : alerts) {
    if (auto *x = lt::alert_cast<lt::torrent_finished_alert>(a)) {
      out.push_back(event(1, key(x->handle.info_hashes()), ""));
    } else if (auto *x = lt::alert_cast<lt::metadata_received_alert>(a)) {
      out.push_back(event(2, key(x->handle.info_hashes()), ""));
    } else if (auto *x = lt::alert_cast<lt::save_resume_data_alert>(a)) {
      Event e = event(3, key(x->params.info_hashes), "");
      auto buf = lt::write_resume_data_buf(x->params);
      e.data.reserve(buf.size());
      for (char c : buf)
        e.data.push_back(static_cast<std::uint8_t>(c));
      out.push_back(std::move(e));
    } else if (auto *x = lt::alert_cast<lt::save_resume_data_failed_alert>(a)) {
      out.push_back(event(8, key(x->handle.info_hashes()), x->message()));
    } else if (auto *x = lt::alert_cast<lt::torrent_error_alert>(a)) {
      out.push_back(event(4, key(x->handle.info_hashes()), x->message()));
    } else if (auto *x = lt::alert_cast<lt::file_error_alert>(a)) {
      out.push_back(event(4, key(x->handle.info_hashes()), x->message()));
    } else if (auto *x = lt::alert_cast<lt::torrent_removed_alert>(a)) {
      out.push_back(event(5, key(x->info_hashes), ""));
    } else if (auto *x = lt::alert_cast<lt::listen_failed_alert>(a)) {
      out.push_back(event(6, "", x->message()));
    } else if (auto *x = lt::alert_cast<lt::listen_succeeded_alert>(a)) {
      out.push_back(event(7, "", x->message()));
    }
  }
  return out;
}

} // namespace tinystream
