CREATE OR ALTER PROCEDURE dbo.sp_DeactivateUpstoxConnection
    @Id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Id IS NOT NULL
        UPDATE UpstoxConnection SET IsActive = 0, UpdatedAtUtc = SYSUTCDATETIME() WHERE Id = @Id;
    ELSE
        UPDATE UpstoxConnection SET IsActive = 0, UpdatedAtUtc = SYSUTCDATETIME() WHERE IsActive = 1;
END
