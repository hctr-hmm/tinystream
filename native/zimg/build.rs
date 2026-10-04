// SPDX-License-Identifier: AGPL-3.0-or-later

use native_support::Build;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let b = Build::new("zimg", VERSION, &[]);

    let args = [
        "--enable-static".to_string(),
        "--disable-shared".into(),
        "--with-pic".into(),
        format!("CXXFLAGS={}", b.cflags()),
    ];
    let (url, branch) = ("https://github.com/sekrit-twc/zimg.git", format!("release-{VERSION}"));
    b.once(&args.join(" "), |b| {
        b.git(url, &branch);
        b.exec(&mut b.cmd("./autogen.sh"));
        b.configure(&args.each_ref().map(String::as_str));
    });
    b.licenses(&format!("{url} ({branch})"), &["COPYING"]);
}
