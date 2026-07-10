mod analytics;
mod db;
mod saves;
mod types;

use axum::{Json, Router, routing::get};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::filter::EnvFilter;

#[derive(Clone)]
pub struct AppStateInner {
    pub db: sea_orm::DatabaseConnection,
}

pub type AppState = Arc<AppStateInner>;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/lag_sim".to_string());
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .expect("PORT must be a number");

    let db = match db::init_db(&database_url).await {
        Ok(db) => {
            tracing::info!("database connected");
            db
        }
        Err(e) => {
            tracing::warn!("database connection failed: {e}");
            std::process::exit(1);
        }
    };

    let state: AppState = Arc::new(AppStateInner { db });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(|| async move {
            Json(types::HealthResponse {
                status: "ok".to_string(),
                db: "connected".to_string(),
            })
        }))
        .merge(analytics::router())
        .merge(saves::router())
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind address");
    axum::serve(listener, app)
        .await
        .expect("server error");
}
