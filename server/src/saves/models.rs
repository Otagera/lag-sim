use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "cloud_saves")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub device_id: String,
    pub save_data: Json,
    pub version: i32,
    pub updated_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
