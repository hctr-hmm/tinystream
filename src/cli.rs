// SPDX-License-Identifier: AGPL-3.0-or-later

use std::path::PathBuf;

use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(version = env!("TINYSTREAM_VERSION"), about)]
pub struct Cli {
    #[arg(long, short, env = "TINYSTREAM_CONFIG", global = true, value_name = "FILE")]
    pub config: Option<PathBuf>,

    #[arg(long, env = "TINYSTREAM_DATA_DIR", global = true, value_name = "DIR")]
    pub data_dir: Option<PathBuf>,

    #[command(subcommand)]
    pub command: Option<Command>,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    Serve,
    Paths,
    Check,
    ResetPassword {
        username: String,
        #[arg(long)]
        password: Option<String>,
    },
}
