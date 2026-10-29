import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData, 
  type WhitespaceData,
  type LineData,
  type HistogramData,
  type SeriesMarker,
  CrosshairMode
} from 'lightweight-charts';
import { fetchCandles } from '../api/tradingApi';
import type { CandleData, LtpQuote, OrderResult } from '../types/trading';
import { BarChart3, RefreshCw } from 'lucide-react';

interface TradingViewChartProps {
  liveQuote?: LtpQuote;
  recentOrders?: OrderResult[];
  isMarketOpen?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  liveQuote, 
  recentOrders, 
  isMarketOpen = false 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const currentBarRef = useRef<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);

  const [interval, setInterval] = useState<'1minute' | '5minute'>('1minute');
  const [showIndicators, setShowIndicators] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Load candle data from API
  const loadCandles = async () => {
    try {
      setLoading(true);
      const data = await fetchCandles(interval, 300);
      if (!candleSeriesRef.current || data.length === 0) return;

      // Map to Lightweight Charts format (timestamp in seconds)
      const candleData: (CandlestickData | WhitespaceData)[] = [];
      const volumeData: HistogramData[] = [];
      const closePrices: { time: number; close: number }[] = [];

      data.forEach((c: CandleData) => {
        const timeInSeconds = Math.floor(new Date(c.timestampUtc).getTime() / 1000);
        candleData.push({
          time: timeInSeconds as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        });

        volumeData.push({
          time: timeInSeconds as any,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
        });

        closePrices.push({ time: timeInSeconds, close: c.close });
      });

      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current?.setData(volumeData);

      // Track last closed candle
      const lastCandle = data[data.length - 1];
      if (lastCandle) {
        currentBarRef.current = {
          time: Math.floor(new Date(lastCandle.timestampUtc).getTime() / 1000),
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close
        };
      }

      // Compute EMA9 & EMA21 for overlay
      if (closePrices.length >= 9) {
        const ema9Data: LineData[] = calculateEma(closePrices, 9);
        ema9SeriesRef.current?.setData(ema9Data);
      }
      if (closePrices.length >= 21) {
        const ema21Data: LineData[] = calculateEma(closePrices, 21);
        ema21SeriesRef.current?.setData(ema21Data);
      }

      // Add execution markers if recent orders exist
      if (recentOrders && recentOrders.length > 0) {
        const markers: SeriesMarker<any>[] = [];
        recentOrders.forEach(ord => {
          if (ord.executionTimeUtc) {
            const ordTime = Math.floor(new Date(ord.executionTimeUtc).getTime() / 1000);
            markers.push({
              time: ordTime,
              position: ord.transactionType === 'BUY' ? 'belowBar' : 'aboveBar',
              color: ord.transactionType === 'BUY' ? '#10b981' : '#ef4444',
              shape: ord.transactionType === 'BUY' ? 'arrowUp' : 'arrowDown',
              text: `${ord.transactionType} ${ord.quantity}`
            });
          }
        });
        if (markers.length > 0) {
          try {
            createSeriesMarkers(candleSeriesRef.current, markers);
          } catch {
            // ignore marker alignment if timestamp outside candle range
          }
        }
      }

      chartRef.current?.timeScale().fitContent();
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed loading candles for chart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for EMA line calculation
  const calculateEma = (prices: { time: number; close: number }[], period: number): LineData[] => {
    const k = 2 / (period + 1);
    const result: LineData[] = [];
    let prevEma = 0;

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        prevEma += prices[i].close;
        continue;
      }
      if (i === period - 1) {
        prevEma = (prevEma + prices[i].close) / period;
        result.push({ time: prices[i].time as any, value: prevEma });
        continue;
      }
      prevEma = prices[i].close * k + prevEma * (1 - k);
      result.push({ time: prices[i].time as any, value: Math.round(prevEma * 100) / 100 });
    }
    return result;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#06080C' },
        textColor: '#A2AEC1',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.035)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.035)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#6A768A', width: 1, style: 2 },
        horzLine: { color: '#6A768A', width: 1, style: 2 }
      },
      rightPriceScale: {
        borderColor: '#1A212D',
        scaleMargins: { top: 0.1, bottom: 0.25 }
      },
      timeScale: {
        borderColor: '#1A212D',
        timeVisible: true,
        secondsVisible: false
      },
      autoSize: true
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#19E58C',
      downColor: '#FF4D67',
      borderVisible: false,
      wickUpColor: '#19E58C',
      wickDownColor: '#FF4D67'
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume'
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#45B8FF', // Sky Neon
      lineWidth: 2,
      title: 'EMA 9'
    });

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#FFB020', // Amber Neon
      lineWidth: 2,
      title: 'EMA 21'
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema9SeriesRef.current = ema9Series;
    ema21SeriesRef.current = ema21Series;

    loadCandles();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [interval]);

  // Update live candle bar on tick (ONLY during active market hours)
  useEffect(() => {
    // If market is closed, DO NOT inject or update live tick bars
    if (!isMarketOpen || !liveQuote || !candleSeriesRef.current) return;

    try {
      const intervalSec = interval === '5minute' ? 300 : 60;
      const tickTime = Math.floor(new Date(liveQuote.timestamp).getTime() / 1000);
      const bucketTime = Math.floor(tickTime / intervalSec) * intervalSec;

      if (!currentBarRef.current || bucketTime > currentBarRef.current.time) {
        // Start new interval candle with live price
        currentBarRef.current = {
          time: bucketTime,
          open: liveQuote.ltp,
          high: liveQuote.ltp,
          low: liveQuote.ltp,
          close: liveQuote.ltp
        };
      } else if (bucketTime === currentBarRef.current.time) {
        // Update high/low/close of active candle
        currentBarRef.current.high = Math.max(currentBarRef.current.high, liveQuote.ltp);
        currentBarRef.current.low = Math.min(currentBarRef.current.low, liveQuote.ltp);
        currentBarRef.current.close = liveQuote.ltp;
      } else {
        return;
      }

      candleSeriesRef.current.update({
        time: currentBarRef.current.time as any,
        open: currentBarRef.current.open,
        high: currentBarRef.current.high,
        low: currentBarRef.current.low,
        close: currentBarRef.current.close
      });
    } catch {
      // ignore tick timing alignment edge cases
    }
  }, [liveQuote, isMarketOpen, interval]);

  // Toggle EMA lines
  useEffect(() => {
    ema9SeriesRef.current?.applyOptions({ visible: showIndicators });
    ema21SeriesRef.current?.applyOptions({ visible: showIndicators });
  }, [showIndicators]);

  const currentPrice = liveQuote?.ltp ?? 0;
  const obZoneLow = currentPrice > 0 ? (currentPrice * 0.988).toFixed(2) : '--';
  const obZoneHigh = currentPrice > 0 ? (currentPrice * 0.996).toFixed(2) : '--';
  const liquidityPrice = currentPrice > 0 ? (currentPrice * 0.980).toFixed(2) : '--';
  const resistancePrice = currentPrice > 0 ? (currentPrice * 1.018).toFixed(2) : '--';

  return (
    <div className="ob-panel rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1A212D] gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#19E58C]/10 text-[#19E58C] rounded-xl border border-[#19E58C]/20 shadow-[0_0_15px_rgba(25,229,140,0.15)]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">IDEA</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161C27] text-slate-300 font-mono border border-[#242D3C]">NSE EQ</span>
              <span className="text-xs text-[#2DD4BF] font-mono flex items-center gap-1">
                <span className="ob-sonar-dot !w-1.5 !h-1.5"></span>
                INE669E01016
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>Vodafone Idea Order Block Feed</span>
              <span>&bull;</span>
              {isMarketOpen ? (
                <span className="text-[#19E58C] font-semibold flex items-center gap-1.5">
                  <span className="ob-sonar-dot !w-1.5 !h-1.5"></span>
                  Live Market Feed
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Market Closed (Static Session)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval Switcher */}
          <div className="flex bg-[#11161F] p-0.5 rounded-xl border border-[#1A212D] text-xs font-mono">
            <button
              onClick={() => setInterval('1minute')}
              className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                interval === '1minute'
                  ? 'bg-gradient-to-r from-[#19E58C] to-[#2DD4BF] text-[#06080C] font-bold shadow-[0_2px_10px_rgba(25,229,140,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1m
            </button>
            <button
              onClick={() => setInterval('5minute')}
              className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                interval === '5minute'
                  ? 'bg-gradient-to-r from-[#19E58C] to-[#2DD4BF] text-[#06080C] font-bold shadow-[0_2px_10px_rgba(25,229,140,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5m
            </button>
          </div>

          {/* Indicator Toggle */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-3 py-1 text-xs rounded-xl border transition-all duration-200 font-mono ${
              showIndicators
                ? 'bg-[#45B8FF]/15 text-[#45B8FF] border-[#45B8FF]/40 shadow-[0_0_12px_rgba(69,184,255,0.2)]'
                : 'bg-[#11161F] text-slate-500 border-[#1A212D]'
            }`}
          >
            EMA (9/21)
          </button>

          {/* Refresh */}
          <button
            onClick={loadCandles}
            disabled={loading}
            className="p-1.5 bg-[#11161F] hover:bg-[#161C27] text-slate-300 rounded-xl border border-[#1A212D] hover:border-[#2DD4BF]/40 transition-colors disabled:opacity-50"
            title="Refresh candles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2DD4BF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* OrderBlock Institutional Zone & Liquidity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
        {/* Order Block Zone Box */}
        <div className="ob-zone-box p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider text-[#19E58C] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19E58C] animate-pulse"></span>
              Order Block Zone
            </div>
            <div className="text-xs font-mono font-bold text-white mt-0.5">
              ₹{obZoneLow} &ndash; ₹{obZoneHigh}
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#19E58C]/20 text-[#19E58C] border border-[#19E58C]/30">
            Institutional Buy
          </span>
        </div>

        {/* Resistance Level */}
        <div className="bg-[#11161F] border border-[#1A212D] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider text-[#FF4D67] uppercase">
              Resistance Target
            </div>
            <div className="text-xs font-mono font-bold text-white mt-0.5">
              ₹{resistancePrice}
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF4D67]/15 text-[#FF4D67] border border-[#FF4D67]/25">
            Seller Wall
          </span>
        </div>

        {/* Liquidity Trap Line */}
        <div className="bg-[#11161F] border border-[#FFB020]/25 rounded-xl p-2.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono font-bold tracking-wider text-[#FFB020] uppercase flex items-center gap-1">
              <span>Liquidity Trap</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#FFB020]">
              ₹{liquidityPrice}
            </span>
          </div>
          <div className="ob-liq-line mt-2">
            <span className="ob-liq-spark"></span>
          </div>
        </div>
      </div>

      {/* Chart Indicator Legend */}
      <div className="flex flex-wrap items-center gap-4 py-1.5 px-1 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#19E58C] shadow-[0_0_6px_rgba(25,229,140,0.6)]"></div>
          <span className="text-slate-300">Bullish Candlestick</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FF4D67] shadow-[0_0_6px_rgba(255,77,103,0.6)]"></div>
          <span className="text-slate-300">Bearish Candlestick</span>
        </div>
        {showIndicators && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#45B8FF] shadow-[0_0_6px_#45B8FF]"></div>
              <span className="text-[#45B8FF]">EMA 9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#FFB020] shadow-[0_0_6px_#FFB020]"></div>
              <span className="text-[#FFB020]">EMA 21</span>
            </div>
          </>
        )}
        {lastRefreshed && (
          <span className="ml-auto text-slate-500 text-[11px] font-mono">Synced: {lastRefreshed}</span>
        )}
      </div>

      {/* Main Chart Container with Overlay Scanner Beam */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden border border-[#1A212D] bg-[#06080C] shadow-inner">
        <div className="ob-scanner-beam"></div>
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
