// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("dav1d", VERSION, &["nasm"]);
    let options = ["--default-library=static", "-Denable_tools=false", "-Denable_tests=false"];
    let url = format!("https://code.videolan.org/videolan/dav1d/-/archive/{VERSION}/dav1d-{VERSION}.tar.gz");

    b.once(&options.join(" "), |b| {
        b.fetch(&url, &[]);
        b.meson(&options);
    });

    b.licenses(&url, &["COPYING"]);
}
