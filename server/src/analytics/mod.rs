pub mod handlers;
pub mod models;
pub mod queries;
pub mod types;

use axum::{Router, routing::{get, post}};
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/analytics/event", post(handlers::ingest_event))
        .route("/api/v1/analytics/aggregates", get(handlers::get_aggregates))
        .route("/api/v1/analytics/leaderboard", get(handlers::get_leaderboard))
}
