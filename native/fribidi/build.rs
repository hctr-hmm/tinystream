// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("fribidi", VERSION, &[]);
    let options = ["--default-library=static", "-Ddocs=false", "-Dbin=false", "-Dtests=false"];
    b.once(&options.join(" "), |b| {
        b.fetch(&format!("https://github.com/fribidi/fribidi/archive/refs/tags/v{VERSION}.tar.gz"), &[]);
        b.meson(&options);
    });
}
