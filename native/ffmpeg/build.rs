// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

fn main() {
    let version = env!("CARGO_PKG_VERSION").strip_suffix(".0").unwrap_or(env!("CARGO_PKG_VERSION"));

    let b = Build::new(
        "ffmpeg",
        version,
        &["nasm", "va", "dav1d", "x264", "zimg", "freetype", "fribidi", "harfbuzz", "ass", "opus", "mp3lame"],
    );

    let lame = std::env::var("DEP_MP3LAME_PREFIX").expect("no metadata from lame-src");

    let args = [
        "--pkg-config-flags=--static".to_string(),
        format!("--extra-cflags={} -I{lame}/include", b.cflags()),
        format!("--extra-ldflags=-L{lame}/lib"),
        "--enable-static".into(),
        "--disable-shared".into(),
        "--enable-pic".into(),
        "--extra-libs=-lstdc++ -lm".into(),
        "--enable-gpl".into(),
        "--enable-libx264".into(),
        "--enable-libdav1d".into(),
        "--enable-vaapi".into(),
        "--disable-libdrm".into(),
        "--enable-libzimg".into(),
        "--enable-libass".into(),
        "--enable-libfreetype".into(),
        "--enable-libfribidi".into(),
        "--enable-libharfbuzz".into(),
        "--enable-libopus".into(),
        "--enable-libmp3lame".into(),
        "--disable-programs".into(),
        "--disable-doc".into(),
        "--disable-network".into(),
        "--disable-indevs".into(),
        "--disable-outdevs".into(),
        "--disable-debug".into(),
        "--enable-optimizations".into(),
        "--enable-runtime-cpudetect".into(),
    ];

    let url = format!("https://ffmpeg.org/releases/ffmpeg-{version}.tar.gz");

    b.once(&args.join(" "), |b| {
        b.fetch(&url, &[]);
        b.configure(&args.each_ref().map(String::as_str));
    });

    b.licenses(&url, &["LICENSE.md", "COPYING.GPLv2", "COPYING.LGPLv2.1"]);
}
