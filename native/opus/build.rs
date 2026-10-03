// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("opus", VERSION, &[]);
    let args = [
        "--enable-static".to_string(),
        "--disable-shared".into(),
        "--with-pic".into(),
        "--disable-doc".into(),
        "--disable-extra-programs".into(),
        format!("CFLAGS={}", b.cflags()),
    ];
    b.once(&args.join(" "), |b| {
        b.fetch(&format!("https://downloads.xiph.org/releases/opus/opus-{VERSION}.tar.gz"), &[]);
        b.configure(&args.each_ref().map(String::as_str));
    });
}
