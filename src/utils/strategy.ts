import type { Stock, Strategy } from '../types';

const RSI_MAP: Record<string, number> = {
  SHOP: 62.46,
  WPM: 40.51,
  OTEX: 34.00,
  CLS: 46.41,
};

const RELATIVE_STRENGTH_MAP: Record<string, number> = {
  WPM: 1.08,
  CLS: 1.14,
};

const getMarketSentiment = (
  spyAbove50: boolean,
  spyAbove200: boolean,
  vixFearIndex: number,
  nasdaqRsi: number
): { sentiment: string; reason: string } => {
  if (spyAbove50 && spyAbove200 && vixFearIndex < 18) {
    return { sentiment: 'BULLISH', reason: 'Strong trend + low fear' };
  }
  if (!spyAbove200 && vixFearIndex > 25) {
    return { sentiment: 'BEARISH', reason: 'Weak structure + high fear' };
  }
  if (vixFearIndex > 35) {
    return { sentiment: 'PANIC', reason: 'Extreme volatility' };
  }
  if (nasdaqRsi > 70) {
    return { sentiment: 'OVERHEATED', reason: 'Tech overbought' };
  }
  return { sentiment: 'NEUTRAL', reason: 'Mixed conditions' };
};

const getSignal = (
  boomExt: number,
  volTrend: number,
  rsiVal: number,
  currPrice: number,
  sma50Level: number,
  marketSentiment: string
): { signal: string; reason: string } => {
  let signal = 'HOLD';
  let reason = 'Neutral setup';

  if (boomExt > 45 && volTrend < 1) {
    signal = 'SELL';
    reason = 'Overextended + weak volume';
  } else if (rsiVal > 80) {
    signal = 'SELL';
    reason = 'Overbought';
  } else if (rsiVal < 35) {
    signal = 'BUY';
    reason = 'Oversold zone';
  } else if (currPrice > sma50Level && rsiVal < 60) {
    signal = 'ACCUMULATE';
    reason = 'Uptrend intact';
  }

  // Apply market sentiment adjustments
  if (signal === 'BUY' && ['BEARISH', 'PANIC'].includes(marketSentiment)) {
    signal = 'HOLD';
    reason += ' | Blocked by weak market';
  } else if (signal === 'ACCUMULATE' && marketSentiment === 'BULLISH') {
    reason += ' | Market tailwind';
  } else if (signal === 'SELL' && marketSentiment === 'BEARISH') {
    reason += ' | Bear market pressure';
  }

  return { signal, reason };
};

export const evaluateStrategy = (
  stock: Stock | undefined,
  vixFearIndex: number,
  nasdaqRsi: number,
  spyAbove50: boolean,
  spyAbove200: boolean,
  selectedStock: string
): Strategy => {
  if (!stock) return {} as Strategy;

  const currPrice = stock.price;
  const sma200Level = stock.low52 * 1.05;
  const sma50Level = stock.low52 * 1.12;
  const boomExt = ((currPrice - sma200Level) / sma200Level) * 100;
  const volTrend = stock.volume / (stock.volume * 1.05);
  const rsiVal = RSI_MAP[selectedStock] || 46.41;
  const { sentiment, reason } = getMarketSentiment(spyAbove50, spyAbove200, vixFearIndex, nasdaqRsi);
  const { signal, reason: signalReason } = getSignal(boomExt, volTrend, rsiVal, currPrice, sma50Level, sentiment);
  const relativeStrength = RELATIVE_STRENGTH_MAP[selectedStock] || 0.95;

  return {
    ticker: selectedStock,
    price: currPrice,
    sma50: parseFloat(sma50Level.toFixed(2)),
    sma200: parseFloat(sma200Level.toFixed(2)),
    rsi: rsiVal,
    boomExt: parseFloat(boomExt.toFixed(2)),
    volTrend: parseFloat(volTrend.toFixed(2)),
    marketSentiment: sentiment,
    marketReason: reason,
    relativeStrength: parseFloat(relativeStrength.toFixed(2)),
    signal,
    reasoning: signalReason,
  };
};
