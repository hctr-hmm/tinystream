# AGENTS.md

## General Guidelines

* Follow the formatting guidelines of this project.
  * Don't randomly comment.
  * Read code sorrounding your change to copy its styling.
* Never hardcode RSS/Torznab sources.

## Development Workflow

* While developing, run only `cargo run` as to not trigger a really long, CPU-killing build process with `cargo run --release`. `cargo check` is usually enough if you want to see only if a project compiles over if a feature works. `cargo test` is also usually a very good replacement for running things in release mode.
* Run `cargo fmt` when a task is done.
* When something is ready for release (this doesn't mean when a task is done; it is up to the user to decide this), compile with `cargo --release` and test compilation on platforms for which the compiler toolchain is available locally; report the full platform set: what completed and what didn't (and if it didn't because the toolchain is not available).
