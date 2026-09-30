// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("boost", VERSION, &[]);
    let dir = format!("boost_{}", VERSION.replace('.', "_"));
    b.once("", |b| {
        b.fetch(
            &format!("https://archives.boost.io/release/{VERSION}/source/{dir}.tar.gz"),
            &[&format!("{dir}/boost")],
        );
    });
    b.export("include", &b.src);
}
