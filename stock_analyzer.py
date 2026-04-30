import yfinance as yf
import pandas as pd
import numpy as np
import pandas_ta as ta
from datetime import datetime, timedelta

import warnings

# This silences the specific warning coming from the yfinance internal files
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message=".*Timestamp.utcnow.*")

def run_stock_analysis(tickers):
    results = []

    # Timezone-aware date handling
    end_date = pd.Timestamp.now(tz='UTC')
    start_date = end_date - pd.Timedelta(days=365)

    for symbol in tickers:
        try:
            t = yf.Ticker(symbol)
            df = t.history(start=start_date, end=end_date)

            if df.empty or len(df) < 200:
                print(f"Skipping {symbol}: Not enough historical data.")
                continue

            # FIX: Flatten MultiIndex columns (The 2026 yfinance update fix)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            info = t.info

            # TECHNICAL INDICATORS
            df['SMA_50'] = ta.sma(df['Close'], length=50)
            df['SMA_200'] = ta.sma(df['Close'], length=200)
            df['RSI'] = ta.rsi(df['Close'], length=14)

            # SENTIMENT MODELING (Boom Extension & Volume)
            df['Boom_Ext'] = ((df['Close'] - df['SMA_200']) / df['SMA_200']) * 100
            df['Vol_MA'] = ta.sma(df['Volume'], length=20)
            df['Vol_Trend'] = df['Volume'] / df['Vol_MA']

            last = df.iloc[-1]
            curr_price = last['Close']

            # BUY/HOLD/SELL LOGIC
            signal = "HOLD"
            reason = "Trend is healthy"

            if last['Boom_Ext'] > 45 and last['Vol_Trend'] < 1.0:
                signal = "SELL / DIP ALERT"
                reason = "Overextended + Low Volume"
            elif last['RSI'] > 80:
                signal = "SELL"
                reason = "Extremely Overbought"
            elif last['RSI'] < 35:
                signal = "BUY"
                reason = "Oversold / Value Zone"
            elif curr_price > last['SMA_50'] and last['RSI'] < 60:
                signal = "ACCUMULATE"
                reason = "Strong trend, room to grow"

            # Helper for period returns
            def get_ret(days):
                try:
                    target_ts = df.index[-1] - pd.Timedelta(days=days)
                    past_price = df['Close'].asof(target_ts)
                    return ((curr_price - past_price) / past_price) * 100
                except: return 0

            results.append({
                'Ticker': symbol,
                'Name': info.get('shortName', 'N/A'),
                'Sector': info.get('sector', 'N/A'),
                'Industry': info.get('industry', 'N/A'),
                'Price': round(curr_price, 2),
                '1D %': ((curr_price - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100,
                '1M %': get_ret(30),
                '6M %': get_ret(180),
                'Ext %': last['Boom_Ext'],
                'RSI': last['RSI'],
                'Vol Trend': last['Vol_Trend'],
                'SIGNAL': signal,
                'Reasoning': reason
            })
        except Exception as e:
            print(f"Error analyzing {symbol}: {e}")

    return pd.DataFrame(results)

# --- EXECUTION ---
my_tickers = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'AMD', 'NFLX']
df_results = run_stock_analysis(my_tickers)

# --- PRESENTATION & GROUPING ---
if not df_results.empty:
    df_results = df_results.sort_values(['Sector', 'Industry', 'SIGNAL'])

    # Highlight the signals visually
    def color_signal(val):
        if 'SELL' in val: return 'background-color: #ffb3b3; color: black; font-weight: bold'
        if 'BUY' in val: return 'background-color: #b3ffb3; color: black; font-weight: bold'
        if 'ACCUMULATE' in val: return 'background-color: #e6ffcc; color: black'
        return ''

    styled_df = df_results.style.format({
        '1D %': '{:.2f}%', '1M %': '{:.2f}%', '6M %': '{:.2f}%',
        'Ext %': '{:.1f}%', 'RSI': '{:.1f}', 'Vol Trend': '{:.2f}x'
    }).map(color_signal, subset=['SIGNAL']).background_gradient(
        cmap='RdYlGn', subset=['1D %', '1M %'], vmin=-5, vmax=5
    )

    # HTML Generation for GitHub Pages
    html_output = styled_df.to_html(escape=False)

    full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Stock Analysis Results</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        .dataframe {{ width: auto; }}
    </style>
</head>
<body>
    <h1>Stock Analysis Results</h1>
    {html_output}
</body>
</html>
"""

    with open('index.html', 'w') as f:
        f.write(full_html)

    print("index.html created successfully.")
