use axum::{Json, extract::{Path, State}, http::StatusCode, response::IntoResponse};

use super::queries;
use crate::AppState;

pub async fn save_game(
    State(state): State<AppState>,
    Json(payload): Json<super::types::CloudSavePayload>,
) -> impl IntoResponse {
    match queries::upsert_save(&state.db, &payload.device_id, payload.save_data, payload.version).await {
        Ok(()) => {
            let updated_at = chrono::Utc::now().to_rfc3339();
            Json(super::types::CloudSaveResponse { ok: true, updated_at }).into_response()
        }
        Err(e) => {
            tracing::error!("failed to save game: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(super::types::CloudSaveResponse {
                    ok: false,
                    updated_at: String::new(),
                }),
            )
                .into_response()
        }
    }
}

pub async fn load_game(
    State(state): State<AppState>,
    Path(device_id): Path<String>,
) -> impl IntoResponse {
    match queries::load_save(&state.db, &device_id).await {
        Ok(Some(entry)) => Json(entry).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => {
            tracing::error!("failed to load game: {e}");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}
