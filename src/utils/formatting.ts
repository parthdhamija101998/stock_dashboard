export const getChangeMetrics = (
  change: number,
  changePercent: number,
  timeframe: string = '1D'
) => {
  const multipliers: Record<string, number> = {
    '1H': 0.15,
    '1D': 1.0,
    '1W': 2.40,
    '1M': 5.80,
  };

  const mult = multipliers[timeframe] || 1.0;
  const rawChange = change * mult;
  const rawPct = changePercent * mult;

  return {
    text: (rawChange >= 0 ? '+' : '') + rawChange.toFixed(2),
    pct: (rawPct >= 0 ? '+' : '') + rawPct.toFixed(2) + '%',
    isPositive: rawPct >= 0,
  };
};

export const getPriceProjections = (price: number) => ({
  plus5: parseFloat((price * 1.05).toFixed(2)),
  plus2_5: parseFloat((price * 1.025).toFixed(2)),
  minus2_5: parseFloat((price * 0.975).toFixed(2)),
  minus5: parseFloat((price * 0.95).toFixed(2)),
});

export const formatTime = (date: Date = new Date()): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
