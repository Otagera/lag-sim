use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(CloudSave::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(CloudSave::DeviceId)
                            .string_len(64)
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(CloudSave::SaveData)
                            .json_binary()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(CloudSave::Version)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(CloudSave::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(CloudSave::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum CloudSave {
    Table,
    DeviceId,
    SaveData,
    Version,
    UpdatedAt,
}
