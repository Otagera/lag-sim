use migration::MigratorTrait;
use sea_orm::{Database, DatabaseConnection};

pub async fn init_db(database_url: &str) -> Result<DatabaseConnection, sea_orm::DbErr> {
    let db = Database::connect(database_url).await?;
    migration::Migrator::up(&db, None).await?;
    tracing::info!("database migrated successfully");
    Ok(db)
}
