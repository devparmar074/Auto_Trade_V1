using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace AutoTrade.Infrastructure.Data;

public interface ISqlConnectionFactory
{
    IDbConnection CreateConnection();
}

public class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=AutoTradeDb;Integrated Security=true;TrustServerCertificate=True;";
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
