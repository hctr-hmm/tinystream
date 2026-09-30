// SPDX-License-Identifier: AGPL-3.0-or-later

use std::env;

fn main() {
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=src/shim.cpp");
    println!("cargo:rerun-if-changed=src/shim.h");

    let dep = |key: &str| env::var(format!("DEP_TORRENT_RASTERBAR_{key}")).unwrap();
    let mut shim = cxx_build::bridge("src/lib.rs");
    shim.file("src/shim.cpp")
        .std("c++17")
        .include(dep("INCLUDE"))
        .flag("-isystem")
        .flag(dep("BOOST"))
        .opt_level(2)
        .warnings(false);

    for define in dep("DEFINES").split(' ') {
        match define.split_once('=') {
            Some((k, v)) => shim.define(k, v),
            None => shim.define(define, None),
        };
    }
    shim.compile("tinystream-libtorrent-shim");

    println!("cargo:rustc-link-search=native={}", dep("LIB"));
    println!("cargo:rustc-link-lib=static=torrent-rasterbar");
    println!("cargo:rustc-link-lib=dylib=ssl");
    println!("cargo:rustc-link-lib=dylib=crypto");
    println!("cargo:rustc-link-lib=dylib=stdc++");
}
