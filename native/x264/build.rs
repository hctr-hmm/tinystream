// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const COMMIT: &str = "b35605ace3ddf7c1a5d67a2eb553f034aef41d55";

fn main() {
    let b = Build::new("x264", env!("CARGO_PKG_VERSION"), &["nasm"]);
    let args = [
        "--enable-static".to_string(),
        "--enable-pic".into(),
        "--disable-cli".into(),
        format!("--extra-cflags={}", b.cflags()),
    ];
    let url = format!("https://code.videolan.org/videolan/x264/-/archive/{COMMIT}/x264-{COMMIT}.tar.gz");
    b.once(&format!("{COMMIT} {}", args.join(" ")), |b| {
        b.fetch(&url, &[]);
        b.configure(&args.each_ref().map(String::as_str));
    });
    b.licenses(&url, &["COPYING"]);
}
