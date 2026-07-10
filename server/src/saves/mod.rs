pub mod handlers;
pub mod models;
pub mod queries;
pub mod types;

use axum::{Router, routing::{get, put}};
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/saves", put(handlers::save_game))
        .route("/api/v1/saves/:device_id", get(handlers::load_game))
}
