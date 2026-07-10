use serde::Serialize;
use typeshare::typeshare;

#[typeshare]
#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub db: String,
}
