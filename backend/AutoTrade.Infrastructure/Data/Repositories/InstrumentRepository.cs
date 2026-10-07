using System.Data;
using AutoTrade.Application.Interfaces;
using AutoTrade.Domain.Entities;
using Dapper;

namespace AutoTrade.Infrastructure.Data.Repositories;

public class InstrumentRepository : IInstrumentRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public InstrumentRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task UpsertInstrumentAsync(Instrument instrument, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@InstrumentKey", instrument.InstrumentKey);
        parameters.Add("@TradingSymbol", instrument.TradingSymbol);
        parameters.Add("@CompanyName", instrument.CompanyName);
        parameters.Add("@Exchange", instrument.Exchange);
        parameters.Add("@Segment", instrument.Segment);
        parameters.Add("@Isin", instrument.Isin);
        parameters.Add("@SecurityType", instrument.SecurityType);
        parameters.Add("@LotSize", instrument.LotSize);
        parameters.Add("@TickSize", instrument.TickSize);
        parameters.Add("@FreezeQuantity", instrument.FreezeQuantity);
        parameters.Add("@ExchangeToken", instrument.ExchangeToken);

        await db.ExecuteAsync(
            "dbo.sp_UpsertInstrument", 
            parameters, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Instrument?> GetInstrumentBySymbolAsync(string symbol, string exchange = "NSE", CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<Instrument>(
            "dbo.sp_GetInstrumentBySymbol", 
            new { TradingSymbol = symbol, Exchange = exchange }, 
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Instrument?> GetInstrumentByKeyAsync(string instrumentKey, CancellationToken ct = default)
    {
        using var db = _connectionFactory.CreateConnection();
        return await db.QueryFirstOrDefaultAsync<Instrument>(
            "dbo.sp_GetInstrumentByKey", 
            new { InstrumentKey = instrumentKey }, 
            commandType: CommandType.StoredProcedure);
    }
}
