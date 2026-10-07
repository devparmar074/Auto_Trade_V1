import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import type { 
  BotConfig, 
  LtpQuote, 
  OrderResult, 
  Position, 
  RiskAlert, 
  StrategyScore, 
  UpstoxAuthStatus 
} from '../types/trading';
import type { CustomStrategyEvaluationResult } from '../types/customStrategy';

interface SignalREvents {
  onLtpUpdated?: (quote: LtpQuote) => void;
  onOrderUpdated?: (order: OrderResult) => void;
  onPositionUpdated?: (position: Position) => void;
  onMarketStatusUpdated?: (status: string) => void;
  onBrokerConnectionUpdated?: (status: UpstoxAuthStatus) => void;
  onStrategyScoreUpdated?: (score: StrategyScore) => void;
  onCustomStrategyScoreUpdated?: (result: CustomStrategyEvaluationResult) => void;
  onBotConfigUpdated?: (config: BotConfig) => void;
  onRiskAlert?: (alert: RiskAlert) => void;
}

export function useTradingHub(events: SignalREvents) {
  const [isConnected, setIsConnected] = useState(false);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const hubUrl = `${import.meta.env.VITE_API_URL || ''}/hubs/trading`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('LtpUpdated', (quote: LtpQuote) => {
      eventsRef.current.onLtpUpdated?.(quote);
    });

    connection.on('OrderUpdated', (order: OrderResult) => {
      eventsRef.current.onOrderUpdated?.(order);
    });

    connection.on('PositionUpdated', (pos: Position) => {
      eventsRef.current.onPositionUpdated?.(pos);
    });

    connection.on('MarketStatusUpdated', (status: string) => {
      eventsRef.current.onMarketStatusUpdated?.(status);
    });

    connection.on('BrokerConnectionUpdated', (status: UpstoxAuthStatus) => {
      eventsRef.current.onBrokerConnectionUpdated?.(status);
    });

    connection.on('StrategyScoreUpdated', (score: StrategyScore) => {
      eventsRef.current.onStrategyScoreUpdated?.(score);
    });

    connection.on('CustomStrategyScoreUpdated', (result: CustomStrategyEvaluationResult) => {
      eventsRef.current.onCustomStrategyScoreUpdated?.(result);
    });

    connection.on('BotConfigUpdated', (config: BotConfig) => {
      eventsRef.current.onBotConfigUpdated?.(config);
    });

    connection.on('RiskAlert', (alert: RiskAlert) => {
      eventsRef.current.onRiskAlert?.(alert);
    });

    connection.start()
      .then(() => setIsConnected(true))
      .catch((err) => {
        console.warn('SignalR initial connection error:', err);
        setIsConnected(false);
      });

    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    return () => {
      connection.stop();
    };
  }, []);

  return { isHubConnected: isConnected };
}
