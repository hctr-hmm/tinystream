// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("libva", VERSION, &[]);

    let options = ["-Dwith_x11=no", "-Dwith_glx=no", "-Dwith_wayland=no"];
    b.once(&options.join(" "), |b| {
        b.fetch(&format!("https://github.com/intel/libva/archive/refs/tags/{VERSION}.tar.gz"), &[]);
        b.meson(&options);
    });
}
