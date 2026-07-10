use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Serialize, Deserialize)]
pub struct CloudSavePayload {
    pub device_id: String,
    pub save_data: serde_json::Value,
    pub version: i32,
}

#[typeshare]
#[derive(Serialize)]
pub struct CloudSaveResponse {
    pub ok: bool,
    pub updated_at: String,
}

#[typeshare]
#[derive(Serialize, Deserialize)]
pub struct CloudSaveEntry {
    pub device_id: String,
    pub save_data: serde_json::Value,
    pub version: i32,
    pub updated_at: String,
}
