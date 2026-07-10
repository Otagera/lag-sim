use sea_orm::{ActiveModelTrait, DatabaseConnection, DatabaseBackend, DbErr, FromQueryResult, Set, Statement};
use uuid::Uuid;

use super::models;

#[derive(FromQueryResult)]
struct CountResult {
    count: i64,
}

pub async fn count_sessions(db: &DatabaseConnection) -> Result<i64, DbErr> {
    let result = CountResult::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        "SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE event_type = 'session_start'",
    ))
    .one(db)
    .await?
    .ok_or(DbErr::RecordNotFound("no sessions".into()))?;
    Ok(result.count)
}

#[derive(FromQueryResult)]
struct AvgResult {
    avg: Option<f64>,
}

pub async fn average_week(db: &DatabaseConnection) -> Result<f64, DbErr> {
    let result = AvgResult::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        "SELECT AVG(week) AS avg FROM analytics_events WHERE event_type = 'game_over'",
    ))
    .one(db)
    .await?
    .ok_or(DbErr::RecordNotFound("no game overs".into()))?;
    Ok(result.avg.unwrap_or(0.0))
}

#[derive(FromQueryResult)]
struct DeathCauseRow {
    game_over_type: String,
    count: i64,
}

pub async fn death_cause_distribution(db: &DatabaseConnection) -> Result<Vec<(String, i64)>, DbErr> {
    let rows = DeathCauseRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        r#"
        SELECT event_data->>'game_over_type' AS game_over_type, COUNT(*) AS count
        FROM analytics_events
        WHERE event_type = 'game_over'
        GROUP BY game_over_type
        ORDER BY count DESC
        "#,
    ))
    .all(db)
    .await?;

    Ok(rows.into_iter().map(|r| (r.game_over_type, r.count)).collect())
}

#[derive(FromQueryResult)]
struct ArchetypeRow {
    archetype: String,
    count: i64,
}

pub async fn archetype_distribution(db: &DatabaseConnection) -> Result<Vec<(String, i64)>, DbErr> {
    let rows = ArchetypeRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        r#"
        SELECT archetype, COUNT(DISTINCT session_id) AS count
        FROM analytics_events
        WHERE event_type = 'session_start'
        GROUP BY archetype
        ORDER BY count DESC
        "#,
    ))
    .all(db)
    .await?;

    Ok(rows.into_iter().map(|r| (r.archetype, r.count)).collect())
}

#[derive(FromQueryResult)]
struct GoalRow {
    goal_id: Option<String>,
    count: i64,
}

pub async fn goal_distribution(db: &DatabaseConnection) -> Result<Vec<(String, i64)>, DbErr> {
    let rows = GoalRow::find_by_statement(Statement::from_string(
        DatabaseBackend::Postgres,
        r#"
        SELECT event_data->>'goal_id' AS goal_id, COUNT(*) AS count
        FROM analytics_events
        WHERE event_type = 'session_start'
        GROUP BY goal_id
        ORDER BY count DESC
        "#,
    ))
    .all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| (r.goal_id.unwrap_or_else(|| "none".into()), r.count))
        .collect())
}

#[derive(FromQueryResult)]
struct LeaderboardRow {
    session_id: Uuid,
    week: i32,
    archetype: Option<String>,
    game_over_type: Option<String>,
    reached_second_term: bool,
}

pub async fn leaderboard(
    db: &DatabaseConnection,
    limit: u64,
) -> Result<Vec<super::types::LeaderboardEntry>, DbErr> {
    let rows = LeaderboardRow::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        r#"
        SELECT
            session_id,
            week,
            archetype,
            event_data->>'game_over_type' AS game_over_type,
            COALESCE((event_data->>'reached_second_term')::boolean, false) AS reached_second_term
        FROM analytics_events
        WHERE event_type = 'game_over'
        ORDER BY week DESC
        LIMIT $1
        "#,
        [limit.into()],
    ))
    .all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| super::types::LeaderboardEntry {
            session_id: r.session_id.to_string(),
            week: r.week,
            archetype: r.archetype,
            game_over_type: r.game_over_type,
            reached_second_term: r.reached_second_term,
        })
        .collect())
}

pub async fn insert_event(
    db: &DatabaseConnection,
    payload: super::types::AnalyticsEventPayload,
) -> Result<(), DbErr> {
    let id = Uuid::new_v4();
    let session_id = Uuid::parse_str(&payload.session_id)
        .map_err(|e| DbErr::Custom(format!("invalid session_id: {e}")))?;

    models::ActiveModel {
        id: Set(id),
        session_id: Set(session_id),
        device_id_hash: Set(payload.device_id_hash),
        event_type: Set(payload.event_type),
        week: Set(payload.week),
        archetype: Set(payload.archetype),
        event_data: Set(Some(payload.event_data)),
        created_at: Default::default(),
    }
    .insert(db)
    .await?;

    Ok(())
}
