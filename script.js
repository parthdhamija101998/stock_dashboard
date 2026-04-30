// All available stock data from the analyzer
const allStockData = {
    'AAPL': {
        name: 'Apple Inc.',
        price: 270.17,
        change1d: -0.20,
        change1m: 9.54,
        change6m: 0.12,
        rsi: 57.5,
        volTrend: 0.73,
        signal: 'ACCUMULATE',
        sector: 'Technology',
        reasoning: 'Strong trend, room to grow'
    },
    'MSFT': {
        name: 'Microsoft Corporation',
        price: 424.46,
        change1d: -1.12,
        change1m: 18.25,
        change6m: -17.69,
        rsi: 61.8,
        volTrend: 1.14,
        signal: 'HOLD',
        sector: 'Technology',
        reasoning: 'Trend is healthy'
    },
    'NVDA': {
        name: 'NVIDIA Corporation',
        price: 209.25,
        change1d: -1.84,
        change1m: 26.69,
        change6m: 3.35,
        rsi: 65.4,
        volTrend: 0.84,
        signal: 'HOLD',
        sector: 'Technology',
        reasoning: 'Trend is healthy'
    },
    'TSLA': {
        name: 'Tesla, Inc.',
        price: 372.80,
        change1d: -0.86,
        change1m: 4.93,
        change6m: -18.35,
        rsi: 47.2,
        volTrend: 0.66,
        signal: 'HOLD',
        sector: 'Consumer Cyclical',
        reasoning: 'Trend is healthy'
    },
    'GOOGL': {
        name: 'Alphabet Inc.',
        price: 349.94,
        change1d: 0.05,
        change1m: 27.95,
        change6m: 24.62,
        rsi: 71.2,
        volTrend: 1.42,
        signal: 'HOLD',
        sector: 'Communication Services',
        reasoning: 'Trend is healthy'
    },
    'META': {
        name: 'Meta Platforms, Inc.',
        price: 669.12,
        change1d: -0.33,
        change1m: 24.75,
        change6m: 3.38,
        rsi: 58.6,
        volTrend: 1.27,
        signal: 'ACCUMULATE',
        sector: 'Communication Services',
        reasoning: 'Strong trend, room to grow'
    },
    'AMD': {
        name: 'Advanced Micro Devices, Inc.',
        price: 337.11,
        change1d: 4.30,
        change1m: 71.96,
        change6m: 31.62,
        rsi: 76.2,
        volTrend: 1.10,
        signal: 'HOLD',
        sector: 'Technology',
        reasoning: 'Trend is healthy'
    },
    'NFLX': {
        name: 'Netflix, Inc.',
        price: 92.12,
        change1d: -0.16,
        change1m: -0.91,
        change6m: -17.67,
        rsi: 41.0,
        volTrend: 0.62,
        signal: 'HOLD',
        sector: 'Communication Services',
        reasoning: 'Trend is healthy'
    }
};

let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
const searchBar = document.getElementById('search-bar');
const addButton = document.getElementById('add-ticker-button');
const table = document.getElementById('stock-table');
const tableBody = table.querySelector('tbody');

// Event Listeners
searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTicker();
    }
});

addButton.addEventListener('click', addTicker);

function addTicker() {
    const ticker = searchBar.value.toUpperCase().trim();

    if (!ticker) {
        showToast('Please enter a ticker symbol', 'error');
        return;
    }

    if (!allStockData[ticker]) {
        showToast(`Ticker \"${ticker}\" not found`, 'error');
        return;
    }

    if (watchlist.includes(ticker)) {
        showToast(`${ticker} is already in your watchlist`, 'warning');
        return;
    }

    watchlist.push(ticker);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    searchBar.value = '';
    renderTable();
    showToast(`${ticker} added to watchlist`, 'success');
}

function removeTicker(ticker) {
    watchlist = watchlist.filter(t => t !== ticker);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderTable();
    showToast(`${ticker} removed from watchlist`, 'success');
}

function renderTable() {
    if (watchlist.length === 0) {
        tableBody.innerHTML = '<tr><td colspan=\"6\" class=\"empty-state\"><h2>No tickers added</h2><p>Search and add stock tickers to get started</p></td></tr>';
        return;
    }

    tableBody.innerHTML = watchlist.map(ticker => {
        const data = allStockData[ticker];
        const changeClass = data.change1d >= 0 ? 'positive' : 'negative';
        const signalClass = data.signal.toLowerCase().replace(' / ', '-').replace(' ', '-');
        const changeSign = data.change1d >= 0 ? '+' : '';

        return `
            <tr>
                <td class=\"ticker\">${ticker}</td>
                <td>$${data.price.toFixed(2)}</td>
                <td class=\"${changeClass}\">${changeSign}${data.change1d.toFixed(2)}%</td>
                <td><span class=\"signal ${signalClass}\">${data.signal}</span></td>
                <td>${data.sector}</td>
                <td><button class=\"delete-btn\" onclick=\"removeTicker('${ticker}')\">Delete</button></td>
            </tr>
        `;
    }).join('');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initial render
renderTable();