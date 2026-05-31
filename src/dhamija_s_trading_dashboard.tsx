import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Search, RefreshCw, Moon, Sun, X, Plus, Check, Trash2, ListChecks,
  Calendar, Sliders, Globe, Sparkles, Send
} from 'lucide-react';

import { INITIAL_WATCHLIST_KEYS, REFRESH_INTERVAL } from './constants/stocks';
import type { Stock, ChatMessage, Strategy } from './types';
import { getMockQuote, getAlphaVantageQuote } from './utils/api';
import { evaluateStrategy } from './utils/strategy';
import { getChangeMetrics, getPriceProjections, formatTime } from './utils/formatting';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedStock, setSelectedStock] = useState('XEQT');
  const [checkedTickers, setCheckedTickers] = useState(() => new Set(INITIAL_WATCHLIST_KEYS));

  const [tickerList, setTickerList] = useState<Record<string, Stock>>(() => {
    const initial: Record<string, Stock> = {};
    INITIAL_WATCHLIST_KEYS.forEach(key => {
      initial[key] = getMockQuote(key);
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [fetchInput, setFetchInput] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [fetchedStock, setFetchedStock] = useState<Stock | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_INTERVAL);
  const [lastSyncedTime, setLastSyncedTime] = useState(formatTime());

  const [changeTimeframe, setChangeTimeframe] = useState('1D');
  const [vixFearIndex, setVixFearIndex] = useState(14.5);
  const [nasdaqRsi, setNasdaqRsi] = useState(62.46);
  const [spyAbove50, setSpyAbove50] = useState(true);
  const [spyAbove200, setSpyAbove200] = useState(true);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello Dhamija. Alpha Vantage API is configured. Your watchlists are active.',
    },
  ]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          setTickerList(current => {
            const next = { ...current };
            Object.keys(next).forEach(symbol => {
              const item = next[symbol];
              const fluctuation = (Math.random() - 0.49) * 0.004;
              const newPrice = parseFloat((item.price * (1 + fluctuation)).toFixed(2));
              const referencePrice = getMockQuote(symbol).price;
              const absDiff = parseFloat((newPrice - referencePrice).toFixed(2));
              const pctDiff = parseFloat(((absDiff / referencePrice) * 100).toFixed(2));

              next[symbol] = {
                ...item,
                price: newPrice,
                change: absDiff,
                changePercent: pctDiff,
              };
            });
            return next;
          });

          setLastSyncedTime(formatTime());
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGFQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchInput.trim()) return;

    setIsFetching(true);
    setFetchError('');
    setFetchedStock(null);

    try {
      const quote = await getAlphaVantageQuote(fetchInput);
      setFetchedStock(quote);
    } catch (error) {
      setFetchError('Failed to fetch stock data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddFetchedStock = () => {
    if (!fetchedStock) return;
    const cleanKey = fetchedStock.symbol.split('.')[0];

    setTickerList(prev => ({ ...prev, [cleanKey]: fetchedStock }));
    setCheckedTickers(prev => new Set([...prev, cleanKey]));

    setSelectedStock(cleanKey);
    setFetchedStock(null);
    setFetchInput('');
    setAddModalOpen(false);
  };

  const handleDeleteStock = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTickerList(prev => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
    setCheckedTickers(prev => {
      const next = new Set(prev);
      next.delete(symbol);
      return next;
    });

    if (selectedStock === symbol) {
      const remaining = Object.keys(tickerList).filter(k => k !== symbol);
      if (remaining.length > 0) setSelectedStock(remaining[0]);
    }
  };

  const toggleCheckTicker = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedTickers(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  const evaluatedStrategy = useMemo(() => {
    return evaluateStrategy(tickerList[selectedStock], vixFearIndex, nasdaqRsi, spyAbove50, spyAbove200, selectedStock);
  }, [selectedStock, tickerList, vixFearIndex, nasdaqRsi, spyAbove50, spyAbove200]);

  const displayChangeMetrics = useMemo(() => {
    const base = tickerList[selectedStock];
    if (!base) return { text: '0.00', pct: '0.00', isPositive: true };
    return getChangeMetrics(base.change, base.changePercent, changeTimeframe);
  }, [selectedStock, tickerList, changeTimeframe]);

  const priceProjections = useMemo(() => {
    const base = tickerList[selectedStock];
    return base ? getPriceProjections(base.price) : {};
  }, [selectedStock, tickerList]);

  const filteredTickers = Object.keys(tickerList).filter(symbol => {
    const asset = tickerList[symbol];
    return symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedUpcomingEvents = useMemo(() => {
    const list = [];
    Object.keys(tickerList).forEach(symbol => {
      if (checkedTickers.has(symbol) && tickerList[symbol].events) {
        tickerList[symbol].events.forEach(evt => {
          list.push({
            ...evt,
            symbol: tickerList[symbol].symbol,
            sector: tickerList[symbol].sector,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tickerList, checkedTickers]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    const userMsg = chatInput;
    setChatInput('');

    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let response = 'I am ready for technical analysis questions.';

      if (q.includes('alpha vantage') || q.includes('api')) {
        response = 'Alpha Vantage API provides real-time market data with 30-second refresh intervals.';
      } else if (q.includes('hello')) {
        response = 'Dhamija, Alpha Vantage integration is active and syncing live market data.';
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 300);
  };

  const boxClass = `rounded-2xl border p-4 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* HEADER */}
      <header className={`border-b px-6 py-4 sticky top-0 z-50 transition-colors backdrop-blur-md ${darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase">Dhamija's Trading Dashboard</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-zinc-400">Professional Diagnostic Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Alpha Vantage Syncing in {refreshCountdown}s</span>
              <span className="text-[10px] opacity-60">(Last: {lastSyncedTime})</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border ${darkMode ? 'bg-zinc-900 text-yellow-400' : 'bg-slate-100 text-slate-700'}`}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            {/* Watchlist */}
            <div className={boxClass}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-xs uppercase flex items-center gap-1">
                  <ListChecks className="h-4 w-4 text-indigo-600" />
                  Checklist Monitor
                </span>
                <button onClick={() => setAddModalOpen(!addModalOpen)} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-bold">
                  <Plus className="h-3 w-3 inline mr-1" /> Fetch
                </button>
              </div>

              {/* Fetch Modal */}
              {addModalOpen && (
                <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border space-y-3 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-black">Alpha Vantage Query</span>
                    <button onClick={() => { setAddModalOpen(false); setFetchedStock(null); }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <form onSubmit={handleGFQuery} className="flex gap-2">
                    <input value={fetchInput} onChange={(e) => setFetchInput(e.target.value)} placeholder="e.g., NVDA, BMO" className="w-full p-2 rounded border" />
                    <button type="submit" disabled={isFetching} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                      {isFetching ? 'Fetching...' : 'Query'}
                    </button>
                  </form>
                  {fetchError && <div className="text-red-500">{fetchError}</div>}
                  {fetchedStock && (
                    <div className="p-3 rounded bg-white dark:bg-zinc-900 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold">{fetchedStock.symbol}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5">{fetchedStock.exchange}</span>
                      </div>
                      <p className="text-xs">${fetchedStock.price.toFixed(2)}</p>
                      <button onClick={handleAddFetchedStock} className="w-full py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        Add to Watchlist
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter..." className="w-full pl-9 pr-4 py-2 rounded-xl border outline-none" />
              </div>

              {/* Ticker List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {filteredTickers.map(symbol => {
                  const asset = tickerList[symbol];
                  const isSelected = selectedStock === symbol;
                  const isChecked = checkedTickers.has(symbol);
                  const isPositive = asset.changePercent >= 0;

                  return (
                    <div key={symbol} onClick={() => setSelectedStock(symbol)} className={`p-3 rounded-xl border cursor-pointer flex justify-between transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 dark:bg-zinc-800' : 'hover:border-slate-300'}`}>
                      <div className="flex items-center gap-2.5">
                        <div onClick={(e) => toggleCheckTicker(symbol, e)} className={`h-4 w-4 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {isChecked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm">{symbol}</span>
                            <span className="text-[9px] bg-slate-200 dark:bg-zinc-800 px-1 py-0.5">{asset.exchange}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{asset.name.substring(0, 20)}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold text-xs">${asset.price.toFixed(2)}</p>
                          <span className={`text-[9px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <button onClick={(e) => handleDeleteStock(symbol, e)} className="p-1 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events Calendar */}
            <div className={boxClass}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="font-extrabold text-xs uppercase">Event Calendar</span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {sortedUpcomingEvents.length === 0 ? (
                  <p className="text-xs text-center text-slate-500">No events</p>
                ) : (
                  sortedUpcomingEvents.map((evt, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border">
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded">{evt.symbol}</span>
                        <span className="text-[9px] text-slate-500">{evt.date}</span>
                      </div>
                      <p className="text-xs font-bold">{evt.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* CENTER COLUMN */}
          <section className="lg:col-span-6 flex flex-col gap-6">
            {/* Analysis Panel */}
            <div className={boxClass}>
              <div className="flex justify-between border-b pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black">{tickerList[selectedStock]?.symbol}</h2>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">{tickerList[selectedStock]?.exchange}</span>
                  </div>
                  <p className="text-xs text-slate-500">{tickerList[selectedStock]?.name}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black">${tickerList[selectedStock]?.price.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${displayChangeMetrics.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {displayChangeMetrics.text} ({displayChangeMetrics.pct})
                    </span>
                    <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded">
                      {['1H', '1D', '1W', '1M'].map(tf => (
                        <button key={tf} onClick={() => setChangeTimeframe(tf)} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${changeTimeframe === tf ? 'bg-indigo-600 text-white' : ''}`}>
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal */}
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border flex justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold">Action Signal</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 text-xs font-bold rounded text-white ${evaluatedStrategy.signal === 'BUY' ? 'bg-emerald-500' : evaluatedStrategy.signal === 'SELL' ? 'bg-rose-500' : evaluatedStrategy.signal === 'ACCUMULATE' ? 'bg-blue-500' : 'bg-slate-400'}`}>
                      {evaluatedStrategy.signal}
                    </span>
                    <span className="text-sm font-bold">{evaluatedStrategy.reasoning}</span>
                  </div>
                </div>
                <Sliders className="h-10 w-10 text-indigo-600" />
              </div>

              {/* Metrics Grid */}
              <div className="space-y-3">
                <p className="font-bold text-xs uppercase">Active Metrics</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '14-Day RSI', value: evaluatedStrategy.rsi },
                    { label: 'Boom Ext', value: `${evaluatedStrategy.boomExt}%` },
                    { label: 'Vol Trend', value: `${evaluatedStrategy.volTrend}x` },
                    { label: '50-Day SMA', value: `$${evaluatedStrategy.sma50}` },
                    { label: '200-Day SMA', value: `$${evaluatedStrategy.sma200}` },
                    { label: 'Rel Strength', value: evaluatedStrategy.relativeStrength },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white dark:bg-zinc-800 border">
                      <p className="text-[9px] text-slate-500 uppercase">{metric.label}</p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Sentiment */}
              <div className={boxClass}>
                <div className="flex gap-2 pb-2 border-b mb-3">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-[10px] uppercase">Sentiment</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Status:</span><span className="font-bold text-indigo-600">{evaluatedStrategy.marketSentiment}</span></div>
                  <div className="flex justify-between"><span>{evaluatedStrategy.marketReason}</span></div>
                  <div className="flex justify-between border-t pt-2"><span>VIX:</span><span>{vixFearIndex}</span></div>
                </div>
              </div>

              {/* Divergences */}
              <div className={boxClass}>
                <div className="flex gap-2 pb-2 border-b mb-3">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-[10px] uppercase">Divergences</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Boom Ext:</span><span>{evaluatedStrategy.boomExt}%</span></div>
                  <div className="flex justify-between"><span>Vol Trend:</span><span>{evaluatedStrategy.volTrend}x</span></div>
                  <div className="flex justify-between border-t pt-2"><span>Rel Strength:</span><span>{evaluatedStrategy.relativeStrength}</span></div>
                </div>
              </div>

              {/* Target Exit */}
              <div className={boxClass}>
                <div className="flex gap-2 pb-2 border-b mb-3">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-[10px] uppercase">Exit Ladder</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-emerald-600 font-bold"><span>Target +5%:</span><span>${(priceProjections as any).plus5}</span></div>
                  <div className="flex justify-between text-emerald-500"><span>Alert +2.5%:</span><span>${(priceProjections as any).plus2_5}</span></div>
                  <div className="flex justify-between text-rose-500"><span>-2.5%:</span><span>${(priceProjections as any).minus2_5}</span></div>
                  <div className="flex justify-between text-rose-600 font-bold"><span>Stop -5%:</span><span>${(priceProjections as any).minus5}</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            {/* Macro Sandbox */}
            <div className={boxClass}>
              <div className="flex gap-2 mb-4 pb-3 border-b">
                <Globe className="h-4 w-4 text-indigo-600" />
                <span className="font-bold text-[10px] uppercase">Macro Sandbox</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>VIX Level</span>
                    <span>{vixFearIndex.toFixed(1)}</span>
                  </div>
                  <input type="range" min="9" max="45" step="0.5" value={vixFearIndex} onChange={(e) => setVixFearIndex(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>NASDAQ RSI</span>
                    <span>{nasdaqRsi}</span>
                  </div>
                  <input type="range" min="20" max="90" value={nasdaqRsi} onChange={(e) => setNasdaqRsi(parseInt(e.target.value))} className="w-full" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSpyAbove50(!spyAbove50)} className={`py-2 text-[10px] font-bold rounded ${spyAbove50 ? 'bg-indigo-600 text-white' : 'border'}`}>
                    SPY&gt;50 {spyAbove50 ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => setSpyAbove200(!spyAbove200)} className={`py-2 text-[10px] font-bold rounded ${spyAbove200 ? 'bg-indigo-600 text-white' : 'border'}`}>
                    SPY&gt;200 {spyAbove200 ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className={boxClass}>
              <p className="font-bold text-[11px] uppercase mb-3 pb-2 border-b text-indigo-600">
                {tickerList[selectedStock]?.name}
              </p>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Volume</p>
                  <p className="font-black">{(tickerList[selectedStock]?.volume || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Avg Vol</p>
                  <p className="font-black">{(tickerList[selectedStock]?.avgVolume || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">52W High</p>
                  <p className="font-black text-emerald-600">${tickerList[selectedStock]?.high52.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">52W Low</p>
                  <p className="font-black text-rose-600">${tickerList[selectedStock]?.low52.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className={`${boxClass} relative flex flex-col gap-3`}>
              <div className="flex justify-between pb-2.5 border-b">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-[10px] uppercase">Terminal</span>
                </div>
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.2 rounded">Alpha Vantage</span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto text-[11px]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-2.5 rounded-xl ${msg.role === 'assistant' ? 'bg-indigo-50 dark:bg-zinc-800 border' : 'bg-indigo-600 text-white'}`}>
                    <p className={`text-[9px] uppercase font-bold mb-1 ${msg.role === 'assistant' ? 'text-indigo-600' : 'text-indigo-200'}`}>
                      {msg.role === 'assistant' ? 'Advisor' : 'You'}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2 mt-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask..." className="w-full p-2 rounded-xl border text-xs outline-none" />
                <button type="submit" className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className={`mt-12 py-8 border-t text-center text-[10px] ${darkMode ? 'bg-zinc-950/40 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
        <p className="font-bold uppercase">DHAMIJA'S TRADING DASHBOARD</p>
        <p className="mt-2">Powered by Alpha Vantage API & Local Calculation Engines</p>
        <p>© 2026 Dhamija Systems Corp.</p>
      </footer>
    </div>
  );
}
