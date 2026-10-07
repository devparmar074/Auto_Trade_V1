export type CombinationMode = 'WEIGHTED_SCORE' | 'AND_LOGIC' | 'OR_LOGIC';

export type IndicatorType = 'MovingAverage' | 'PCR' | 'BollingerBands';

export type TargetSignal = 'BUY' | 'SELL';

export interface StrategyCondition {
  id: string;
  indicator: IndicatorType;
  conditionType: string;
  targetSignal: TargetSignal;
  isEnabled: boolean;
  weight: number;
  
  // Moving Average parameters
  maType?: 'SMA' | 'EMA';
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  
  // PCR parameters
  thresholdValue?: number;
  
  // Bollinger Bands parameters
  stdDevMultiplier?: number;
}

export interface CustomStrategy {
  id: number;
  strategyName: string;
  description?: string;
  isActive: boolean;
  combinationMode: CombinationMode;
  buyThreshold: number;
  sellThreshold: number;
  buyConditions: StrategyCondition[];
  sellConditions: StrategyCondition[];
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface ActiveStrategyInfo {
  activeStrategyType: 'DEFAULT' | 'CUSTOM';
  activeCustomStrategyId?: number | null;
  activeCustomStrategyName: string;
  buyThreshold: number;
  sellThreshold: number;
  combinationMode: CombinationMode;
}

export interface ConditionEvaluationResult {
  conditionId: string;
  indicator: string;
  conditionType: string;
  description: string;
  targetSignal: TargetSignal;
  isMet: boolean;
  weight: number;
  pointsAwarded: number;
  details: string;
}

export interface CustomStrategyEvaluationResult {
  strategyId?: number;
  strategyName: string;
  combinationMode: CombinationMode;
  buyScore: number;
  maxBuyScore: number;
  sellScore: number;
  maxSellScore: number;
  buyThreshold: number;
  sellThreshold: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  currentPrice: number;
  evaluatedAtUtc: string;
  buyConditionResults: ConditionEvaluationResult[];
  sellConditionResults: ConditionEvaluationResult[];
  explanations: string[];
}
