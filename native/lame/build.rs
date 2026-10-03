// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

fn main() {
    let version = env!("CARGO_PKG_VERSION").strip_suffix(".0").unwrap_or(env!("CARGO_PKG_VERSION"));
    let b = Build::new("lame", version, &[]);
    let args = [
        "--enable-static".to_string(),
        "--disable-shared".into(),
        "--with-pic".into(),
        "--disable-frontend".into(),
        "--disable-decoder".into(),
        "--disable-gtktest".into(),
        format!("CFLAGS={}", b.cflags()),
    ];
    b.once(&args.join(" "), |b| {
        b.fetch(&format!("https://downloads.sourceforge.net/project/lame/lame/{version}/lame-{version}.tar.gz"), &[]);
        b.configure(&args.each_ref().map(String::as_str));
    });
    // LAME has no pkg-config file, so FFmpeg's link line doesn't say where it is.
    println!("cargo::rustc-link-search=native={}", b.prefix.join("lib").display());
}
