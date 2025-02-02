let balance = parseFloat(localStorage.getItem('balance')) || 10000;
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || {};
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

async function fetchData() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        const majorCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT'];
        const majorCoinsData = data.filter(item => majorCoins.includes(item.symbol));
        populateMajorCoins(majorCoinsData);
        updatePortfolioTable();
        updateFavoriteList();

    } catch (error) {
        console.error('Veri çekilirken hata oluştu:', error);
    }
}

function populateMajorCoins(coins) {
    const tableBody = document.getElementById('major-coins-data');
    tableBody.innerHTML = '';
    coins.forEach(coin => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td class="symbol">${coin.symbol}</td>
                    <td class="symbol">${(parseFloat(coin.lastPrice)).toFixed(5)}</td>
                    <td class="symbol">${parseFloat(coin.priceChangePercent).toFixed(5)}%</td>
                    <td class="favorite" onclick="addToFavorites('${coin.symbol}')">Ekle</td>
                    <td class="favorite" onclick="removeFromFavorites('${coin.symbol}')">Çıkar</td>
                    <td class="buy" onclick="buyCoin('${coin.symbol}', ${(parseFloat(coin.lastPrice))})">Al</td>
                    <td class="sell" onclick="sellCoin('${coin.symbol}', ${(parseFloat(coin.lastPrice))})">Sat</td>
                `;
        tableBody.appendChild(row);
    });
}

async function fetchTopMovers() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        const usdtPairs = data.filter(item => item.symbol.endsWith('USDT'));

        const sortedData = [...usdtPairs].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
        const topGainers = sortedData.slice(0, 5); 
        const topLosers = sortedData.slice(-5);    

        populateCoinTable(topGainers, 'top-gainers-data');
        populateCoinTable(topLosers.reverse(), 'top-losers-data');
    } catch (error) {
        console.error('En çok yükselen/düşen coinler alınırken hata:', error);
    }
}


function populateCoinTable(coins, tableId) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    coins.forEach(coin => {
        const lastPrice = parseFloat(coin.lastPrice);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="symbol">${coin.symbol}</td>
            <td class="symbol">${lastPrice.toFixed(5)}</td>
            <td class="symbol">${parseFloat(coin.priceChangePercent).toFixed(5)}%</td>
            <td class="favorite" onclick="addToFavorites('${coin.symbol}')">Ekle</td>
            <td class="favorite" onclick="removeFromFavorites('${coin.symbol}')">Çıkar</td>
            <td class="buy" onclick="buyCoin('${coin.symbol}', ${(parseFloat(coin.lastPrice))})">Al</td>
            <td class="sell" onclick="sellCoin('${coin.symbol}', ${(parseFloat(coin.lastPrice))})">Sat</td>
        `;
        tableBody.appendChild(row);
    });
}
function addToFavorites(symbol) {
    if (!favorites.includes(symbol)) {
        favorites.push(symbol);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoriteList();
        alert(`${symbol} favorilere eklendi.`);
    } else {
        alert(`${symbol} zaten favorilerde.`);
    }
}

function removeFromFavorites(symbol) {
    const index = favorites.indexOf(symbol);
    if (index !== -1) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoriteList();
        alert(`${symbol} favorilerden çıkarıldı.`);
    } else {
        alert(`${symbol} zaten favorilerde değil.`);
    }
}

async function updateFavoriteList() {
    const tableBody = document.getElementById('favorite-coins-list');
    tableBody.innerHTML = '';

    if (favorites.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Favori coin bulunmamaktadır.</td></tr>';
        return;
    }

    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        favorites.forEach(symbol => {
            const coinData = data.find(item => item.symbol === symbol);

            if (coinData) {
                const lastPrice = parseFloat(coinData.lastPrice).toFixed(4);
                const priceChangePercent = parseFloat(coinData.priceChangePercent).toFixed(4);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="symbol">${symbol}</td>
                    <td class="symbol">${lastPrice}</td>
                    <td class="symbol">${priceChangePercent}%</td>
                    <td class="buy" onclick="buyCoin('${symbol}', ${lastPrice})">Al</td>
                    <td class="sell" onclick="sellCoin('${symbol}', ${lastPrice})">Sat</td>
                    <td class="favorite" onclick="removeFromFavorites('${symbol}')">Çıkar</td>
                `;
                tableBody.appendChild(row);
            }
        });
    } catch (error) {
        console.error("Favori coin bilgileri alınırken hata oluştu:", error);
    }
}



function buyCoin(symbol, price) {
    const maxBuyable = Math.floor(balance / price);
    const quantity = parseFloat(prompt(`Kaç adet ${symbol} almak istiyorsunuz?(Maks: ${maxBuyable}) Maksimum almak için 'max' yazabilirsiniz.`));

    if (quantity && quantity * price <= balance) {
        balance -= quantity * price;
        portfolio[symbol] = (portfolio[symbol] || 0) + quantity;
        updateData();
    } else {
        alert('Yetersiz bakiye veya geçersiz miktar!');
    }
}

function sellCoin(symbol, price) {
    const maxSellable = portfolio[symbol] || 0;
    const quantity = prompt(`
            Kaç adet ${symbol} satmak istiyorsunuz? (Maks: ${maxSellable})
            Maksimum satmak için 'max' yazabilirsiniz.`);

    if (quantity && portfolio[symbol] && portfolio[symbol] >= quantity) {
        balance += quantity * price;
        portfolio[symbol] -= quantity;
        if (portfolio[symbol] === 0) delete portfolio[symbol];
        updateData();
    } else {
        alert('Yetersiz miktar veya geçersiz işlem!');
    }
}

function updateData() {
    localStorage.setItem('balance', balance);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    document.getElementById('virtual-balance').textContent = balance.toFixed(5);
    updatePortfolioTable();
}

function updatePortfolioTable() {
    const tableBody = document.getElementById('portfolio-data');
    tableBody.innerHTML = '';
    for (const [symbol, quantity] of Object.entries(portfolio)) {
        const latestPrice = getLatestPrice(symbol); 
        if (!isNaN(latestPrice) && latestPrice > 0) {
            const totalValue = quantity * latestPrice; 
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="symbol">${symbol}</td>
                <td class="symbol">${quantity.toFixed(4)}</td>
                <td class="symbol">${totalValue.toFixed(4)}</td>
                <td class="buy" onclick="handlePortfolioBuy('${symbol}', ${latestPrice})">Al</td>
                <td class="sell" onclick="handlePortfolioSell('${symbol}', ${latestPrice})">Sat</td>
            `;
            tableBody.appendChild(row);
        } else {
            console.error(`${symbol} için geçerli fiyat alınamadı.`);
        }
    }
}


function handlePortfolioBuy(symbol, price) {
    const maxBuyable = Math.floor(balance / price);
    const quantity = prompt(`Kaç adet ${symbol} almak istiyorsunuz? (Maks: ${maxBuyable})`);

    if (!quantity) return;
    const finalQuantity = parseFloat(quantity);

    if (!isNaN(finalQuantity) && finalQuantity > 0 && finalQuantity * price <= balance) {
        balance -= finalQuantity * price;
        portfolio[symbol] = (portfolio[symbol] || 0) + finalQuantity;
        updateData();
        alert(`${finalQuantity} adet ${symbol} portföye alındı.`);
    } else {
        alert('Yetersiz bakiye veya geçersiz miktar!');
    }
}

function handlePortfolioSell(symbol, price) {
    if (!portfolio[symbol]) {
        alert(`Portföyünüzde ${symbol} bulunmamaktadır.`);
        return;
    }

    const maxSellable = portfolio[symbol];
    const quantity = prompt(`Kaç adet ${symbol} satmak istiyorsunuz? (Maks: ${maxSellable})`);

    if (!quantity) return;
    const finalQuantity = parseFloat(quantity);

    if (!isNaN(finalQuantity) && finalQuantity > 0 && finalQuantity <= maxSellable) {
        balance += finalQuantity * price;
        portfolio[symbol] -= finalQuantity;
        if (portfolio[symbol] === 0) delete portfolio[symbol];
        updateData();
        alert(`${finalQuantity} adet ${symbol} portföyden satıldı.`);
    } else {
        alert('Yetersiz miktar veya geçersiz işlem!');
    }
}



function getLatestPrice(symbol) {
    let row = Array.from(document.querySelectorAll('#major-coins-data tr')).find(row => row.cells[0].textContent === symbol);
    if (!row) {
        row = Array.from(document.querySelectorAll('#top-gainers-data tr')).find(row => row.cells[0].textContent === symbol) ||
              Array.from(document.querySelectorAll('#top-losers-data tr')).find(row => row.cells[0].textContent === symbol);
    }
    return row ? parseFloat(row.cells[1].textContent) : 0;
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('virtual-balance').textContent = balance.toFixed(5);
    fetchData();
    fetchTopMovers();
    updateFavoriteList();
});