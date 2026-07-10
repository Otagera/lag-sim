use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(AnalyticsEvent::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(AnalyticsEvent::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(AnalyticsEvent::SessionId).uuid().not_null())
                    .col(
                        ColumnDef::new(AnalyticsEvent::DeviceIdHash)
                            .string_len(64)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(AnalyticsEvent::EventType)
                            .string_len(32)
                            .not_null(),
                    )
                    .col(ColumnDef::new(AnalyticsEvent::Week).integer().not_null())
                    .col(ColumnDef::new(AnalyticsEvent::Archetype).string_len(32))
                    .col(ColumnDef::new(AnalyticsEvent::EventData).json_binary())
                    .col(
                        ColumnDef::new(AnalyticsEvent::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .table(AnalyticsEvent::Table)
                    .name("idx_analytics_event_type")
                    .col(AnalyticsEvent::EventType)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .table(AnalyticsEvent::Table)
                    .name("idx_analytics_session_id")
                    .col(AnalyticsEvent::SessionId)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(AnalyticsEvent::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum AnalyticsEvent {
    Table,
    Id,
    SessionId,
    DeviceIdHash,
    EventType,
    Week,
    Archetype,
    EventData,
    CreatedAt,
}
