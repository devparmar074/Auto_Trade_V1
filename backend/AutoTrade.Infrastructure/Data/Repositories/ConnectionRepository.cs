using System.Data;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using AutoTrade.Infrastructure.Upstox.Security;
using Dapper;

namespace AutoTrade.Infrastructure.Data.Repositories;

public class ConnectionRepository : IConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;
    private readonly ITokenEncryptor _encryptor;

    public ConnectionRepository(ISqlConnectionFactory connectionFactory, ITokenEncryptor encryptor)
    {
        _connectionFactory = connectionFactory;
        _encryptor = encryptor;
    }

    public async Task SaveConnectionAsync(UpstoxConnection connection, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var encryptedToken = _encryptor.Encrypt(connection.EncryptedAccessToken);
        var encryptedRefreshToken = string.IsNullOrEmpty(connection.EncryptedRefreshToken) 
            ? null 
            : _encryptor.Encrypt(connection.EncryptedRefreshToken);

        var parameters = new DynamicParameters();
        parameters.Add("@EncryptedAccessToken", encryptedToken);
        parameters.Add("@EncryptedRefreshToken", encryptedRefreshToken);
        parameters.Add("@ExpiresAtUtc", connection.ExpiresAtUtc);
        parameters.Add("@UserId", connection.UserId);
        parameters.Add("@UserName", connection.UserName);
        parameters.Add("@Email", connection.Email);
        parameters.Add("@UserType", connection.UserType);

        var id = await db.ExecuteScalarAsync<int>(
            "dbo.sp_SaveUpstoxConnection", 
            parameters, 
            commandType: CommandType.StoredProcedure);

        connection.Id = id;
    }

    public async Task<UpstoxConnection?> GetActiveConnectionAsync(CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var row = await db.QueryFirstOrDefaultAsync<UpstoxConnection>(
            "dbo.sp_GetActiveUpstoxConnection", 
            commandType: CommandType.StoredProcedure);

        if (row != null)
        {
            row.EncryptedAccessToken = _encryptor.Decrypt(row.EncryptedAccessToken);
            if (!string.IsNullOrEmpty(row.EncryptedRefreshToken))
            {
                row.EncryptedRefreshToken = _encryptor.Decrypt(row.EncryptedRefreshToken);
            }
        }

        return row;
    }

    public async Task DeactivateConnectionAsync(int id, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        await db.ExecuteAsync(
            "dbo.sp_DeactivateUpstoxConnection", 
            new { Id = id }, 
            commandType: CommandType.StoredProcedure);
    }
}
