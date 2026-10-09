// SPDX-License-Identifier: AGPL-3.0-or-later

use std::env;

fn main() {
    let android = env::var("CARGO_CFG_TARGET_OS").is_ok_and(|os| os == "android");
    let dirs = env::var_os("DEP_ASS_PKGCONFIG").unwrap();

    unsafe {
        if android {
            // Only what native/ built for the phone, nothing of this machine's.
            env::set_var("PKG_CONFIG_LIBDIR", dirs);
            env::remove_var("PKG_CONFIG_PATH");
            env::set_var("PKG_CONFIG_ALLOW_CROSS", "1");
        } else {
            env::set_var("PKG_CONFIG_PATH", dirs);
        }
    }

    pkg_config::Config::new().statik(true).probe("libass").unwrap_or_else(|e| panic!("can't link libass: {e}"));

    if android {
        println!("cargo::rustc-link-lib=jnigraphics");
        // HarfBuzz is C++.
        println!("cargo::rustc-link-lib=static=c++_static");
        println!("cargo::rustc-link-lib=static=c++abi");
    }
}
