// SPDX-License-Identifier: AGPL-3.0-or-later

use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=migrations");
    version();
    if std::env::var_os("CARGO_FEATURE_WEB_UI").is_none() {
        return;
    }
    for p in ["web/src", "web/public", "web/package.json", "web/vite.config.ts", "web/bun.lock"] {
        println!("cargo:rerun-if-changed={p}");
    }
    println!("cargo:rerun-if-env-changed=TINYSTREAM_SKIP_WEB_BUILD");
    if std::env::var_os("TINYSTREAM_SKIP_WEB_BUILD").is_some() {
        if !Path::new("web/dist/client/index.html").exists() {
            panic!(
                "TINYSTREAM_SKIP_WEB_BUILD is set but web/dist/client is empty; build the UI first (cd web && bun run build)"
            );
        }
        return;
    }

    let runner = if which("bun") {
        "bun"
    } else if which("npm") {
        "npm"
    } else {
        panic!(
            "building the web UI needs bun or npm; install one, or build with --no-default-features for a server without the UI"
        );
    };
    if !Path::new("web/node_modules").exists() {
        run(runner, &["install"]);
    }
    run(runner, &["run", "build"]);
}

fn version() {
    let pkg = std::env::var("CARGO_PKG_VERSION").unwrap();
    let version = match git(&["describe", "--always", "--dirty", "--exclude", "*"]) {
        Some(commit) => format!("{pkg} ({commit})"),
        None => pkg,
    };
    println!("cargo:rustc-env=TINYSTREAM_VERSION={version}");

    let mut watched = vec!["HEAD".to_owned(), "packed-refs".to_owned()];
    watched.extend(git(&["symbolic-ref", "-q", "HEAD"]));
    for p in watched.iter().filter_map(|p| git(&["rev-parse", "--git-path", p])) {
        if Path::new(&p).exists() {
            println!("cargo:rerun-if-changed={p}");
        }
    }
}

fn git(args: &[&str]) -> Option<String> {
    let out = Command::new("git").args(args).output().ok().filter(|o| o.status.success())?;
    Some(String::from_utf8(out.stdout).ok()?.trim().to_owned()).filter(|s| !s.is_empty())
}

fn which(bin: &str) -> bool {
    Command::new(bin).arg("--version").output().is_ok_and(|o| o.status.success())
}

fn run(bin: &str, args: &[&str]) {
    let status =
        Command::new(bin).args(args).current_dir("web").status().unwrap_or_else(|e| panic!("can't run {bin}: {e}"));
    if !status.success() {
        panic!("`{bin} {}` failed in ./web", args.join(" "));
    }
}
