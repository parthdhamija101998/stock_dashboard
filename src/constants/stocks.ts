export const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
export const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
export const REFRESH_INTERVAL = 30;

export const STOCK_DATA_MAP: Record<string, { price: number; name: string; sector: string; exchange: string }> = {
  XEQT: { price: 44.50, name: 'iShares Core Equity ETF Portfolio', sector: 'Index Funds', exchange: 'TSX' },
  NVDA: { price: 949.90, name: 'NVIDIA Corporation', sector: 'US Semiconductors', exchange: 'NASDAQ' },
  BTC: { price: 67468.10, name: 'Bitcoin', sector: 'Cryptocurrency', exchange: 'Crypto' },
  VFV: { price: 125.12, name: 'Vanguard S&P 500 Index ETF', sector: 'Index Funds', exchange: 'TSX' },
  MU: { price: 950.00, name: 'Micron Technology', sector: 'US Semiconductors', exchange: 'NASDAQ' },
  QQD: { price: 22.10, name: 'BetaPro NASDAQ-100 -2x Daily Bear ETF', sector: 'Leveraged Inverse ETFs', exchange: 'TSX' },
  SOXS: { price: 14.20, name: 'BetaPro -3x Semiconductor Bear ETF', sector: 'Leveraged Inverse ETFs', exchange: 'Cboe Canada' },
  IMG: { price: 23.39, name: 'IAMGOLD Corp.', sector: 'Materials (Gold & Silver)', exchange: 'TSX' },
  AEM: { price: 245.00, name: 'Agnico Eagle Mines Ltd.', sector: 'Materials (Gold & Silver)', exchange: 'TSX' },
};

export const US_TICKERS = ['NVDA', 'MU', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
export const ETF_TICKERS = ['XEQT', 'VFV', 'QQD', 'SOXS', 'BTC'];
export const INITIAL_WATCHLIST_KEYS = ['XEQT', 'NVDA', 'BTC', 'VFV', 'MU', 'QQD', 'SOXS', 'IMG', 'AEM'];
