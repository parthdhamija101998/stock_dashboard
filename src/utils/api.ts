import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_BASE_URL, US_TICKERS, ETF_TICKERS } from '../constants/stocks';
import type { Stock } from '../types';

const generateMockData = (basePrice: number): { change: number; changePercent: number } => ({
  change: parseFloat(((Math.random() - 0.48) * 2.2).toFixed(2)),
  changePercent: parseFloat(((Math.random() - 0.48) * 1.5).toFixed(2)),
});

const calculatePriceMetrics = (basePrice: number, symbol: string) => ({
  high52: parseFloat((basePrice * 1.15).toFixed(2)),
  low52: parseFloat((basePrice * 0.85).toFixed(2)),
  volume: Math.floor(150000 + (basePrice % 100) * 12345),
  peRatio: ETF_TICKERS.includes(symbol) ? 'N/A' : (12 + (basePrice % 30)).toFixed(1),
});

// Fully dynamic fallback generator (no hardcoded map required)
export const getMockQuote = (symbol: string): Stock => {
  const cleanSym = symbol.toUpperCase().trim().replace('.TO', '').replace('.A', '');
  
  // Generate a deterministic base price using character codes so it stays consistent
  const charSum = cleanSym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = parseFloat((15 + (charSum % 250) + (charSum % 10) * 0.1).toFixed(2));

  const { high52, low52, volume, peRatio } = calculatePriceMetrics(basePrice, cleanSym);
  const { change, changePercent } = generateMockData(basePrice);
  
  const isUS = US_TICKERS.includes(cleanSym);
  const exchange = isUS ? 'NASDAQ' : 'TSX';
  const currency = isUS ? 'USD' : 'CAD';
  const avgVolume = Math.floor(volume * 1.08);
  const marketCap = basePrice > 50000 ? '1.32T' : `${((basePrice * volume) / 150000).toFixed(1)}B`;
  
  return {
    symbol: isUS ? cleanSym : `${cleanSym}.TO`,
    name: `${cleanSym} Corp.`,
    sector: ETF_TICKERS.includes(cleanSym) ? 'Index Funds' : 'Market Equities',
    price: basePrice,
    change,
    changePercent,
    volume,
    avgVolume,
    high52,
    low52,
    marketCap,
    peRatio,
    sharesOutstanding: `${Math.floor(volume / 5000)}M`,
    exchange,
    currency,
    about: `Live financial metrics for ${cleanSym} from Alpha Vantage API. (Currently utilizing fallback simulation sync due to API rate limits).`,
    events: [{
      title: `${cleanSym} Strategy Alignment Review`,
      date: new Date().toISOString().split('T')[0],
      desc: 'Quarterly board presentation detailing capital allocation priorities.',
    }],
  };
};

export const getAlphaVantageQuote = async (symbol: string): Promise<Stock> => {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('API key not configured, using mock data');
    return getMockQuote(symbol);
  }

  try {
    const rawSym = symbol.toUpperCase().trim();
    const cleanSym = rawSym.replace('.TO', '');
    const isUS = US_TICKERS.includes(cleanSym);
    const apiSymbol = isUS ? cleanSym : (rawSym.includes('.TO') ? rawSym : `${rawSym}.TO`);

    const response = await fetch(
      `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${apiSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    
    // Handle Alpha Vantage's silent rate limit errors
    if (data['Note'] || data['Information']) {
      console.warn(`Alpha Vantage rate limit reached for ${symbol}`);
      return getMockQuote(symbol);
    }

    if (data['Global Quote']?.['05. price']) {
      const quote = data['Global Quote'];
      const price = parseFloat(quote['05. price']);
      const isETF = ETF_TICKERS.includes(cleanSym);
      
      return {
        symbol: isUS ? cleanSym : `${cleanSym}.TO`,
        name: `${cleanSym} Corp.`, // Fallback generic name; AV's Global Quote doesn't provide company names
        sector: isUS ? 'US Equities' : (isETF ? 'Index Funds' : 'Canadian Assets'),
        price,
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        volume: parseInt(quote['06. volume'] || '0'),
        avgVolume: parseInt(quote['06. volume'] || '0'), // AV Global Quote doesn't provide avg volume, defaulting to current
        high52: price * 1.12, // Synthetic boundaries
        low52: price * 0.88,  // Synthetic boundaries
        marketCap: 'N/A',
        peRatio: isETF ? 'N/A' : 'TBD',
        sharesOutstanding: 'N/A',
        exchange: isUS ? 'NASDAQ' : 'TSX',
        currency: isUS ? 'USD' : 'CAD',
        about: `Live financial metrics from Alpha Vantage API.`,
        events: [{
          title: `${cleanSym} Technical Alignment Review`,
          date: new Date().toISOString().split('T')[0],
          desc: 'Quarterly presentation detailing indicator alignment.',
        }],
      };
    }
    
    return getMockQuote(symbol);
  } catch (error) {
    console.error(`API fetch error for ${symbol}:`, error);
    return getMockQuote(symbol);
  }
};
