import React, { useEffect, useState, useRef } from 'react';
import type { 
  BotConfig, 
  LtpQuote, 
  OrderResult, 
  Position, 
  RiskAlert, 
  StrategyScore, 
  TransactionType, 
  UpstoxAuthStatus 
} from './types/trading';
import { 
  fetchAuthStatus, 
  fetchDashboard, 
  fetchRecentOrders, 
  fetchStrategyScore,
  fetchBotConfig,
  getConnectUrl, 
  disconnectBroker, 
  submitLiveOrder,
  submitManualToken,
  fetchRegisteredIp,
  submitRegisteredIp
} from './api/tradingApi';
import { useTradingHub } from './hooks/useTradingHub';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { TradingViewChart } from './components/TradingViewChart';
import { StrategyScoreCard } from './components/StrategyScoreCard';
import { RiskControlCard } from './components/RiskControlCard';
import { SemiAutoAlertModal } from './components/SemiAutoAlertModal';
import { ActiveStrategySelectorBanner } from './components/ActiveStrategySelectorBanner';
import { CustomStrategyScoreCard } from './components/CustomStrategyScoreCard';
import { StrategyCustomizationScreen } from './components/StrategyCustomizationScreen';
import type { ActiveStrategyInfo, CustomStrategyEvaluationResult } from './types/customStrategy';
import { 
  fetchActiveStrategyInfo, 
  fetchActiveCustomStrategyEvaluation, 
  deactivateCustomStrategy 
} from './api/customStrategyApi';
import { 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'terminal' | 'strategy_customizer'>('terminal');

  // Trading & Broker State
  const [authStatus, setAuthStatus] = useState<UpstoxAuthStatus>({ isConnected: false, isExpired: false });
  const [quote, setQuote] = useState<LtpQuote | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [marketStatus, setMarketStatus] = useState<string>('CLOSED');
  const isMarketOpen = marketStatus.toUpperCase().includes('OPEN');
  const [lastOrder, setLastOrder] = useState<OrderResult | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResult[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [lastTickTime, setLastTickTime] = useState<string>('');
  const prevPriceRef = useRef<number | null>(null);

  // Strategy & Risk State
  const [strategyScore, setStrategyScore] = useState<StrategyScore | undefined>(undefined);
  const [activeStrategyInfo, setActiveStrategyInfo] = useState<ActiveStrategyInfo | null>(null);
  const [customStrategyEvaluation, setCustomStrategyEvaluation] = useState<CustomStrategyEvaluationResult | null>(null);
  const [isDeactivatingStrategy, setIsDeactivatingStrategy] = useState<boolean>(false);
  const [botConfig, setBotConfig] = useState<BotConfig | undefined>(undefined);
  const [activeRiskAlert, setActiveRiskAlert] = useState<RiskAlert | null>(null);
  const [isSemiAutoModalOpen, setIsSemiAutoModalOpen] = useState(false);
  const [isExecutingAlert, setIsExecutingAlert] = useState(false);

  // Modals & UI State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingTxType, setPendingTxType] = useState<TransactionType>('BUY');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState<boolean>(false);
  const [primaryIpInput, setPrimaryIpInput] = useState<string>('');
  const [currentRegisteredIp, setCurrentRegisteredIp] = useState<string | null>(null);
  const [isSavingIp, setIsSavingIp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // SignalR Hub Connection & Subscriptions
  const { isHubConnected } = useTradingHub({
    onLtpUpdated: (newQuote) => {
      if (prevPriceRef.current !== null && newQuote.ltp !== prevPriceRef.current) {
        setPriceFlash(newQuote.ltp > prevPriceRef.current ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 700);
      }
      prevPriceRef.current = newQuote.ltp;
      setQuote(newQuote);
      setLastTickTime(new Date().toLocaleTimeString());
    },
    onOrderUpdated: (updatedOrder) => {
      setLastOrder(updatedOrder);
      loadRecentOrders();
      loadDashboard();
    },
    onPositionUpdated: (newPos) => setPosition(newPos),
    onMarketStatusUpdated: (status) => setMarketStatus(status),
    onBrokerConnectionUpdated: (status) => setAuthStatus(status),
    onStrategyScoreUpdated: (score) => {
      setStrategyScore(score);
      // Trigger Semi-Auto modal if bot is in SemiAuto mode and threshold is breached
      if (botConfig && botConfig.botMode === 'SemiAuto' && !botConfig.isKillSwitchActive) {
        if (score.score >= botConfig.buyScoreThreshold || score.score <= botConfig.sellScoreThreshold) {
          setIsSemiAutoModalOpen(true);
        }
      }
    },
    onCustomStrategyScoreUpdated: (result) => {
      setCustomStrategyEvaluation(result);
    },
    onBotConfigUpdated: (config) => setBotConfig(config),
    onRiskAlert: (alert) => {
      setActiveRiskAlert(alert);
      setIsSemiAutoModalOpen(true);
    }
  });

  const loadDashboard = async () => {
    try {
      const data = await fetchDashboard();
      if (data.quote) setQuote(data.quote);
      if (data.position) setPosition(data.position);
      if (data.marketStatus) setMarketStatus(data.marketStatus);
      if (data.lastOrder) setLastOrder(data.lastOrder);
      setAuthStatus({
        isConnected: data.brokerConnected,
        userId: data.brokerUserId,
        userName: data.brokerUserName,
        expiresAtUtc: data.tokenExpiresAtUtc,
        isExpired: false
      });
    } catch { }
  };

  const loadActiveStrategy = async () => {
    try {
      const info = await fetchActiveStrategyInfo();
      setActiveStrategyInfo(info);
      if (info.activeStrategyType === 'CUSTOM') {
        const evalRes = await fetchActiveCustomStrategyEvaluation();
        if (evalRes) setCustomStrategyEvaluation(evalRes);
      } else {
        setCustomStrategyEvaluation(null);
      }
    } catch { }
  };

  const loadStrategyAndConfig = async () => {
    try {
      const [scoreData, configData] = await Promise.all([
        fetchStrategyScore().catch(() => undefined),
        fetchBotConfig().catch(() => undefined)
      ]);
      if (scoreData) setStrategyScore(scoreData);
      if (configData) setBotConfig(configData);
      await loadActiveStrategy();
    } catch { }
  };

  const handleDeactivateCustomStrategy = async () => {
    setIsDeactivatingStrategy(true);
    try {
      const info = await deactivateCustomStrategy();
      setActiveStrategyInfo(info);
      setCustomStrategyEvaluation(null);
      setSuccessToast('Switched back to Default Strategy (Built-in Multi-Factor).');
      setTimeout(() => setSuccessToast(null), 5000);
      loadStrategyAndConfig();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed reverting to default strategy');
    } finally {
      setIsDeactivatingStrategy(false);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const orders = await fetchRecentOrders(10);
      setRecentOrders(orders);
    } catch { }
  };

  useEffect(() => {
    // Initial fetch on mount
    loadDashboard();
    loadRecentOrders();
    loadStrategyAndConfig();
    loadActiveStrategy();
  }, []);

  // When market is OPEN, poll every 5s for dashboard/positions/orders (or 2s fallback if hub disconnected)
  useEffect(() => {
    if (!isMarketOpen) return;

    const interval = setInterval(() => {
      loadDashboard();
      loadStrategyAndConfig();
    }, isHubConnected ? 5000 : 2000);

    return () => clearInterval(interval);
  }, [isMarketOpen, isHubConnected]);

  const handleOpenOrderModal = (type: TransactionType) => {
    if (!authStatus.isConnected) {
      setErrorMessage('Upstox account is not connected. Please connect your Upstox account first.');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('Please enter a valid quantity of 1 or more.');
      return;
    }
    setErrorMessage(null);
    setPendingTxType(type);
    setIsModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitLiveOrder({
        transactionType: pendingTxType,
        orderType: 'MARKET',
        quantity: quantity,
        product: 'D',
        correlationId: `AT_${Date.now()}`
      });

      setLastOrder(result);
      setIsModalOpen(false);

      if (!result.success) {
        setErrorMessage(result.message || 'Order was rejected by Upstox.');
        return;
      }

      setSuccessToast(`Live ${pendingTxType} order submitted! Order ID: ${result.upstoxOrderId || result.localOrderId}`);
      setTimeout(() => setSuccessToast(null), 6000);
      loadRecentOrders();
      loadDashboard();
    } catch (err: any) {
      setIsModalOpen(false);
      setErrorMessage(err.message || 'Failed placing live order to Upstox.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Semi-Auto / Alert 1-Click Execution
  const handleExecuteAlert = async (type: 'BUY' | 'SELL', qty: number) => {
    try {
      setIsExecutingAlert(true);
      const res = await submitLiveOrder({
        transactionType: type,
        orderType: 'MARKET',
        quantity: qty,
        product: 'D',
        correlationId: `SA_${Date.now()}`
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Semi-Auto order was rejected by Upstox.');
      } else {
        setSuccessToast(`1-Click ${type} order filled! Qty: ${qty} shares.`);
        setTimeout(() => setSuccessToast(null), 6000);
        loadDashboard();
        loadRecentOrders();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed executing 1-click order.');
    } finally {
      setIsExecutingAlert(false);
      setActiveRiskAlert(null);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) {
      setErrorMessage('Please paste a valid Upstox Access Token.');
      return;
    }
    setIsValidatingToken(true);
    setErrorMessage(null);
    try {
      const status = await submitManualToken(manualTokenInput.trim());
      setAuthStatus(status);
      setSuccessToast(`Access Token activated! User: ${status.userName || status.userId || 'Active'}`);
      setTimeout(() => setSuccessToast(null), 6000);
      setIsTokenModalOpen(false);
      setManualTokenInput('');
      loadDashboard();
      loadRecentOrders();
      loadStrategyAndConfig();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed validating Access Token with Upstox API.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleOpenIpModal = async () => {
    setIsIpModalOpen(true);
    setErrorMessage(null);
    try {
      const data = await fetchRegisteredIp();
      setCurrentRegisteredIp(data.primaryIp || null);
      if (data.primaryIp) {
        setPrimaryIpInput(data.primaryIp);
      }
    } catch { }
  };

  const handleSaveIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryIpInput.trim()) {
      setErrorMessage('Please enter your public IP address.');
      return;
    }
    setIsSavingIp(true);
    setErrorMessage(null);
    try {
      await submitRegisteredIp(primaryIpInput.trim());
      setSuccessToast(`Static IP ${primaryIpInput.trim()} registered with Upstox! Please paste a fresh access token.`);
      setIsIpModalOpen(false);
      loadDashboard();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed updating static IP on Upstox.');
    } finally {
      setIsSavingIp(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectBroker();
      const status = await fetchAuthStatus();
      setAuthStatus(status);
    } catch { }
  };

  const priceChange = quote ? quote.change : 0;
  const isPriceUp = priceChange >= 0;

  return (
    <div className="bg-[#090d16] min-h-screen text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white m-0">AUTO TRADE</h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO V1
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>NSE: IDEA</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isHubConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {isHubConnected ? 'WebSocket Live' : 'Connecting Feed...'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trading Terminal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('strategy_customizer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'strategy_customizer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Strategy Customizer</span>
            {activeStrategyInfo?.activeStrategyType === 'CUSTOM' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Tag */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
            authStatus.isConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${authStatus.isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span>Upstox: {authStatus.isConnected ? 'Connected' : 'Disconnected'}</span>
            {authStatus.userName && <span className="text-slate-300">({authStatus.userName})</span>}
          </div>

          <button 
            type="button" 
            onClick={handleOpenIpModal} 
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition-colors"
          >
            Static IP
          </button>

          <button 
            type="button" 
            onClick={() => setIsTokenModalOpen(true)} 
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-semibold transition-colors shadow-sm"
          >
            Paste Token
          </button>

          {authStatus.isConnected ? (
            <button 
              type="button" 
              onClick={handleDisconnect} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-mono transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <a 
              href={getConnectUrl()} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-lg text-xs font-mono transition-colors no-underline"
            >
              OAuth Login
            </a>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'strategy_customizer' ? (
        <main className="w-full">
          <StrategyCustomizationScreen
            activeStrategyInfo={activeStrategyInfo}
            onActiveStrategyChanged={(info) => {
              setActiveStrategyInfo(info);
              loadActiveStrategy();
            }}
            onBackToTerminal={() => {
              setActiveTab('terminal');
              loadActiveStrategy();
            }}
          />
        </main>
      ) : (
        <main className="max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
          {/* Alerts & Toasts */}
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successToast && (
            <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successToast}</span>
              </div>
              <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Strategy Mode Selector Banner */}
          <ActiveStrategySelectorBanner
            activeInfo={activeStrategyInfo}
            onDeactivate={handleDeactivateCustomStrategy}
            onNavigateToCustomizer={() => setActiveTab('strategy_customizer')}
            isDeactivating={isDeactivatingStrategy}
          />

          {/* Top Summary Banner: IDEA Quick Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">VODAFONE IDEA LIMITED</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">NSE EQ</span>
                  <span className="text-xs font-mono text-emerald-400">INE669E01016</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Telecom Services &bull; Primary Active Instrument</p>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-2 ${
                isMarketOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isMarketOpen && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                MARKET: {marketStatus}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {/* LTP */}
              <div className={`border rounded-xl p-3.5 text-center transition-all duration-300 relative overflow-hidden ${
                priceFlash === 'up' 
                  ? 'bg-emerald-950/60 border-emerald-500/80 shadow-lg shadow-emerald-500/20' 
                  : priceFlash === 'down' 
                    ? 'bg-rose-950/60 border-rose-500/80 shadow-lg shadow-rose-500/20' 
                    : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-xs font-mono text-slate-400">Live LTP</span>
                  {isMarketOpen && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      1s LIVE
                    </span>
                  )}
                </div>
                <div className={`text-2xl font-extrabold font-mono transition-transform duration-150 ${
                  priceFlash === 'up' 
                    ? 'text-emerald-300 scale-105' 
                    : priceFlash === 'down' 
                      ? 'text-rose-300 scale-105' 
                      : (isPriceUp ? 'text-emerald-400' : 'text-rose-400')
                }`}>
                  ₹{quote ? quote.ltp.toFixed(2) : '--.--'}
                </div>
                <div className={`text-xs font-mono mt-0.5 ${isPriceUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quote ? `${isPriceUp ? '+' : ''}${quote.change.toFixed(2)} (${isPriceUp ? '+' : ''}${quote.changePercent.toFixed(2)}%)` : ''}
                </div>
                {lastTickTime && (
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Tick: {lastTickTime}
                  </div>
                )}
              </div>

              {/* Position */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
                <span className="text-xs font-mono text-slate-400 block mb-1">Active Position</span>
                <div className="text-2xl font-extrabold font-mono text-white">
                  {position ? position.quantity : 0} <span className="text-xs text-slate-400 font-normal">Shares</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Avg: ₹{position ? position.averagePrice.toFixed(2) : '0.00'}
                </div>
              </div>

              {/* Unrealized PnL */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
                <span className="text-xs font-mono text-slate-400 block mb-1">Unrealized P&L</span>
                <div className={`text-2xl font-extrabold font-mono ${(position?.unrealizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{position ? position.unrealizedPnL.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Total: ₹{position ? position.totalPnL.toFixed(2) : '0.00'}
                </div>
              </div>

              {/* Strategy Recommendation */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-center">
                <span className="text-xs font-mono text-slate-400 block mb-1">
                  {activeStrategyInfo?.activeStrategyType === 'CUSTOM' ? 'Custom Conviction' : 'Strategy Conviction'}
                </span>
                {activeStrategyInfo?.activeStrategyType === 'CUSTOM' ? (
                  <>
                    <div className={`text-2xl font-extrabold font-mono ${
                      customStrategyEvaluation?.signal === 'BUY' 
                        ? 'text-emerald-400' 
                        : customStrategyEvaluation?.signal === 'SELL' 
                          ? 'text-rose-400' 
                          : 'text-amber-400'
                    }`}>
                      {customStrategyEvaluation ? customStrategyEvaluation.signal : 'CALCULATING...'}
                    </div>
                    <div className="text-xs font-mono text-slate-300 font-semibold mt-0.5 truncate">
                      {customStrategyEvaluation 
                        ? `Buy: ${(customStrategyEvaluation.buyScore ?? 0).toFixed(0)} | Sell: ${(customStrategyEvaluation.sellScore ?? 0).toFixed(0)}` 
                        : (activeStrategyInfo?.activeCustomStrategyName ?? 'Custom Strategy')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold font-mono text-indigo-400">
                      {strategyScore ? `${strategyScore.score > 0 ? '+' : ''}${strategyScore.score}` : '--'}
                    </div>
                    <div className="text-xs font-mono text-slate-300 font-semibold mt-0.5">
                      {strategyScore?.recommendationText || 'CALCULATING...'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 2-Column Main Trading Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Candlestick Chart & Manual Order Terminal */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Option B: TradingView Candlestick Chart */}
              <TradingViewChart 
                liveQuote={quote || undefined} 
                recentOrders={recentOrders} 
                isMarketOpen={isMarketOpen} 
              />

              {/* Quick Order Terminal */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Manual Order Execution</span>
                </h3>

                <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-4">
                  <span className="text-xs font-mono text-slate-300 font-semibold">Order Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors text-sm"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-white py-1 text-sm font-bold focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="button" 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {lastOrder && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 mb-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Last Execution:</span>
                    <span className={`font-bold ${lastOrder.transactionType === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {lastOrder.transactionType} {lastOrder.quantity} @ ₹{lastOrder.executionPrice?.toFixed(2) || '--'} ({lastOrder.statusText})
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => handleOpenOrderModal('BUY')}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-sm transition-all shadow-lg shadow-emerald-950/40"
                  >
                    BUY IDEA (MARKET)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOpenOrderModal('SELL')}
                    className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-mono font-bold text-sm transition-all shadow-lg shadow-rose-950/40"
                  >
                    SELL IDEA (MARKET)
                  </button>
                </div>

                <div className="text-center mt-2.5 text-[11px] font-mono text-slate-500">
                  Product: Delivery (D) &bull; Order Type: MARKET &bull; Exchange: NSE
                </div>
              </div>

              {/* Recent Executed Orders Audit Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-base font-bold text-white mb-3">Recent Executions</h3>
                {recentOrders.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 py-6 text-center">
                    No orders executed yet in this session.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                          <th className="pb-2">TIME</th>
                          <th className="pb-2">TYPE</th>
                          <th className="pb-2">QTY</th>
                          <th className="pb-2">STATUS</th>
                          <th className="pb-2">PRICE</th>
                          <th className="pb-2">ORDER ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {recentOrders.map((ord, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 text-slate-400">
                              {ord.executionTimeUtc ? new Date(ord.executionTimeUtc).toLocaleTimeString() : '-'}
                            </td>
                            <td className={`py-2.5 font-bold ${ord.transactionType === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {ord.transactionType}
                            </td>
                            <td className="py-2.5 text-white">{ord.quantity}</td>
                            <td className="py-2.5 text-slate-300">{ord.statusText}</td>
                            <td className="py-2.5 text-white">
                              {ord.executionPrice ? `₹${ord.executionPrice.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2.5 text-slate-500">
                              {ord.upstoxOrderId || `#${ord.localOrderId}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): Scoring Engine & Risk Management */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Scoring Engine (Custom Strategy if Active, otherwise Default Multi-Factor Strategy) */}
              {activeStrategyInfo?.activeStrategyType === 'CUSTOM' ? (
                <CustomStrategyScoreCard 
                  customEvaluation={customStrategyEvaluation} 
                  defaultScore={strategyScore} 
                />
              ) : (
                <StrategyScoreCard score={strategyScore} />
              )}

              {/* Option C & D: Risk Management, Trailing SL & Bot Mode Controller */}
              <RiskControlCard 
                config={botConfig} 
                onConfigUpdated={(cfg) => setBotConfig(cfg)}
                onKillSwitchTriggered={() => {
                  loadDashboard();
                  loadStrategyAndConfig();
                }}
              />
            </div>
          </div>
        </main>
      )}

      {/* Manual Order Confirmation Modal */}
      <OrderConfirmationModal 
        isOpen={isModalOpen}
        transactionType={pendingTxType}
        quantity={quantity}
        stockName="Vodafone Idea Limited"
        tradingSymbol="IDEA"
        onConfirm={handleConfirmOrder}
        onCancel={() => setIsModalOpen(false)}
        isSubmitting={isSubmitting}
      />

      {/* Option D: Semi-Auto Alert / Risk Trigger Modal with 1-Click Execution */}
      <SemiAutoAlertModal
        isOpen={isSemiAutoModalOpen}
        score={strategyScore}
        riskAlert={activeRiskAlert}
        onClose={() => {
          setIsSemiAutoModalOpen(false);
          setActiveRiskAlert(null);
        }}
        onExecute={handleExecuteAlert}
        isExecuting={isExecutingAlert}
      />

      {/* Upstox Access Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Enter Upstox Access Token
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-4 leading-relaxed">
              Paste your live Upstox Access Token generated for today. It will be verified against the Upstox API and securely stored.
            </p>

            <form onSubmit={handleSaveToken}>
              <div className="mb-4">
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                  ACCESS TOKEN:
                </label>
                <textarea
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Paste your Upstox access token here (e.g. eyJhbGciOi...)"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
                  disabled={isValidatingToken}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidatingToken || !manualTokenInput.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  {isValidatingToken ? 'Validating Token...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Static IP Modal */}
      {isIpModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Whitelist Upstox Static IP (SEBI Requirement)
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-4 leading-relaxed">
              SEBI requires all algo/automated trading API requests to originate from a whitelisted static IP.
              Upstox allows updating your static IP <strong>once per calendar week</strong>.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 mb-4 text-xs font-mono">
              <span className="text-slate-400">Current IP Registered on Upstox: </span>
              <strong className={currentRegisteredIp ? 'text-emerald-400' : 'text-amber-400'}>
                {currentRegisteredIp || 'None (No IP Configured)'}
              </strong>
            </div>

            <form onSubmit={handleSaveIp}>
              <div className="mb-4">
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                  YOUR PUBLIC IP ADDRESS:
                </label>
                <input
                  type="text"
                  value={primaryIpInput}
                  onChange={(e) => setPrimaryIpInput(e.target.value)}
                  placeholder="e.g. 103.xxx.xxx.xxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="text-[11px] font-mono text-slate-400 mt-1.5">
                  Find your current IP at <a href="https://whatismyipaddress.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">whatismyipaddress.com</a>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4 text-xs font-mono text-rose-300">
                <strong>Important:</strong> Updating your IP will cause Upstox to invalidate your current access token. You will need to copy a fresh token and click <strong>Paste Token</strong>.
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsIpModalOpen(false)}
                  disabled={isSavingIp}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingIp || !primaryIpInput.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  {isSavingIp ? 'Registering with Upstox...' : 'Register IP with Upstox'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
