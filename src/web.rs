// SPDX-License-Identifier: AGPL-3.0-or-later

use axum::Router;
use axum_frontend::{RustEmbed, embed_router};

#[derive(RustEmbed)]
#[folder = "web/dist/client/"]
struct Assets;

pub fn router<S: Clone + Send + Sync + 'static>() -> Router<S> {
    embed_router::<Assets>().with_state(())
}
