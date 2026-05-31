export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high52: number;
  low52: number;
  marketCap: string;
  peRatio: string | number;
  sharesOutstanding: string;
  exchange: string;
  currency: string;
  about: string;
  events: Event[];
}

export interface Event {
  title: string;
  date: string;
  desc: string;
  symbol?: string;
  sector?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Strategy {
  ticker: string;
  price: number;
  sma50: number;
  sma200: number;
  rsi: number;
  boomExt: number;
  volTrend: number;
  marketSentiment: string;
  marketReason: string;
  relativeStrength: number;
  signal: string;
  reasoning: string;
}
