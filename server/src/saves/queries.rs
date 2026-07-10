use sea_orm::{ConnectionTrait, DatabaseConnection, DatabaseBackend, DbErr, FromQueryResult, Statement};

pub async fn upsert_save(
    db: &DatabaseConnection,
    device_id: &str,
    save_data: serde_json::Value,
    version: i32,
) -> Result<(), DbErr> {
    let stmt = Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        r#"
        INSERT INTO cloud_saves (device_id, save_data, version, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (device_id)
        DO UPDATE SET save_data = $2, version = $3, updated_at = NOW()
        "#,
        [device_id.into(), save_data.into(), version.into()],
    );
    db.execute(stmt).await?;
    Ok(())
}

#[derive(FromQueryResult)]
struct SaveRow {
    device_id: String,
    save_data: serde_json::Value,
    version: i32,
    updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn load_save(
    db: &DatabaseConnection,
    device_id: &str,
) -> Result<Option<super::types::CloudSaveEntry>, DbErr> {
    let row = SaveRow::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        "SELECT device_id, save_data, version, updated_at FROM cloud_saves WHERE device_id = $1",
        [device_id.into()],
    ))
    .one(db)
    .await?;

    Ok(row.map(|r| super::types::CloudSaveEntry {
        device_id: r.device_id,
        save_data: r.save_data,
        version: r.version,
        updated_at: r.updated_at.to_rfc3339(),
    }))
}
