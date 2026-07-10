pub use sea_orm_migration::prelude::*;

mod m20250101_000001_create_health_check;
mod m20250710_000001_create_analytics_events;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250101_000001_create_health_check::Migration),
            Box::new(m20250710_000001_create_analytics_events::Migration),
        ]
    }
}
