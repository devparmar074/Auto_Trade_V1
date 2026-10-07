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
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', width: 1, style: 2 },
        horzLine: { color: '#64748b', width: 1, style: 2 }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.25 }
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      },
      autoSize: true
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume'
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#38bdf8', // Sky blue
      lineWidth: 2,
      title: 'EMA 9'
    });

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#f59e0b', // Amber
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-lg">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">IDEA</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">NSE EQ</span>
              <span className="text-xs text-emerald-400 font-mono">INE669E01016</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Vodafone Idea Candlestick Feed &bull; {isMarketOpen ? '🟢 Live Market' : '🔴 Market Closed (Historical Static)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval Switcher */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs font-mono">
            <button
              onClick={() => setInterval('1minute')}
              className={`px-2.5 py-1 rounded transition-colors ${
                interval === '1minute'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1m
            </button>
            <button
              onClick={() => setInterval('5minute')}
              className={`px-2.5 py-1 rounded transition-colors ${
                interval === '5minute'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5m
            </button>
          </div>

          {/* Indicator Toggle */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors font-mono ${
              showIndicators
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            EMA (9/21)
          </button>

          {/* Refresh */}
          <button
            onClick={loadCandles}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh candles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chart Indicator Legend */}
      <div className="flex items-center gap-4 py-2 px-1 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
          <span>Bull Candle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
          <span>Bear Candle</span>
        </div>
        {showIndicators && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-sky-400"></div>
              <span className="text-sky-400">EMA 9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-amber-400"></div>
              <span className="text-amber-400">EMA 21</span>
            </div>
          </>
        )}
        {lastRefreshed && (
          <span className="ml-auto text-slate-500 text-[11px]">Synced: {lastRefreshed}</span>
        )}
      </div>

      {/* Main Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-80 rounded-lg overflow-hidden border border-slate-800/80 bg-[#090d16]" 
      />
    </div>
  );
};
