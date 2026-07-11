use axum::{Json, extract::State, response::IntoResponse};
use serde::Deserialize;

use super::queries;
use crate::AppState;

#[derive(Deserialize)]
pub struct LeaderboardParams {
    pub limit: Option<u64>,
}

pub async fn ingest_event(
    State(state): State<AppState>,
    Json(payloads): Json<Vec<super::types::AnalyticsEventPayload>>,
) -> impl IntoResponse {
    let mut ok = true;
    for payload in payloads {
        if let Err(e) = queries::insert_event(&state.db, payload).await {
            tracing::error!("failed to ingest event: {e}");
            ok = false;
        }
    }
    Json(super::types::AnalyticsIngestResponse { ok })
}

pub async fn get_aggregates(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let db = &state.db;

    let total_sessions = queries::count_sessions(db).await.unwrap_or(0) as i32;
    let average_week = queries::average_week(db).await.unwrap_or(0.0);
    let death_cause_distribution = queries::death_cause_distribution(db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|(label, count)| super::types::LabelCount { label, count: count as i32 })
        .collect();
    let archetype_distribution = queries::archetype_distribution(db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|(label, count)| super::types::LabelCount { label, count: count as i32 })
        .collect();
    let goal_distribution = queries::goal_distribution(db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|(label, count)| super::types::LabelCount { label, count: count as i32 })
        .collect();

    Json(super::types::AnalyticsAggregates {
        total_sessions,
        average_week,
        death_cause_distribution,
        archetype_distribution,
        goal_distribution,
    })
}

pub async fn get_leaderboard(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<LeaderboardParams>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(50).min(200);
    let entries = queries::leaderboard(&state.db, limit).await.unwrap_or_default();
    Json(entries)
}
