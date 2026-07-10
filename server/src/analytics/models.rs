use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "analytics_events")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub session_id: Uuid,
    pub device_id_hash: String,
    pub event_type: String,
    pub week: i32,
    pub archetype: Option<String>,
    pub event_data: Option<Json>,
    pub created_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
