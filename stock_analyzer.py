import json
import os

def run_workflow():
    # 1. LOAD THE LIST (Memory)
    # If the file doesn't exist, start with your default list
    if os.path.exists('tickers.json'):
        with open('tickers.json', 'r') as f:
            my_tickers = json.load(f)
    else:
        my_tickers = ['AAPL', 'MSFT', 'NVDA']
        with open('tickers.json', 'w') as f:
            json.dump(my_tickers, f)

    # 2. RUN ANALYSIS
    df_results = run_stock_analysis(my_tickers)

    # 3. CONVERT TO JS OBJECT (The "Link" to JS)
    # We turn the dataframe into a dictionary for the JS file
    stock_data_dict = {}
    for _, row in df_results.iterrows():
        stock_data_dict[row['Ticker']] = {
            'name': row['Name'],
            'price': row['Price'],
            'change1d': row['1D %'],
            'signal': row['SIGNAL'],
            'sector': row['Sector'],
            'reasoning': row['Reasoning']
        }

    # 4. OVERWRITE THE DATA IN SCRIPT.JS
    # This physically updates the 'const allStockData' inside your JS file
    js_content = f"const allStockData = {json.dumps(stock_data_dict, indent=4)};\n"
    
    # Append the rest of your JS logic here or keep it in a separate file
    # For now, we update a specific data file
    with open('data.js', 'w') as f:
        f.write(js_content)

run_workflow()
