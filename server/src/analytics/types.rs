use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Serialize, Deserialize)]
pub struct AnalyticsEventPayload {
    pub session_id: String,
    pub device_id_hash: String,
    pub event_type: String,
    pub week: i32,
    pub archetype: Option<String>,
    pub event_data: serde_json::Value,
}

#[typeshare]
#[derive(Serialize)]
pub struct AnalyticsIngestResponse {
    pub ok: bool,
}

#[typeshare]
#[derive(Serialize)]
pub struct LabelCount {
    pub label: String,
    pub count: i32,
}

#[typeshare]
#[derive(Serialize)]
pub struct AnalyticsAggregates {
    pub total_sessions: i32,
    pub average_week: f64,
    pub death_cause_distribution: Vec<LabelCount>,
    pub archetype_distribution: Vec<LabelCount>,
    pub goal_distribution: Vec<LabelCount>,
}

#[typeshare]
#[derive(Serialize)]
pub struct LeaderboardEntry {
    pub session_id: String,
    pub week: i32,
    pub archetype: Option<String>,
    pub game_over_type: Option<String>,
    pub reached_second_term: bool,
}
