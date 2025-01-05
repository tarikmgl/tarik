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
                    <td>${coin.symbol}</td>
                    <td>${(parseFloat(coin.lastPrice)).toFixed(5)}</td>
                    <td>${parseFloat(coin.priceChangePercent).toFixed(5)}%</td>
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

        const sortedData = [...data].sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
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
            <td>${coin.symbol}</td>
            <td>${lastPrice.toFixed(5)}</td>
            <td>${parseFloat(coin.priceChangePercent).toFixed(5)}%</td>
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

function updateFavoriteList() {
    const favoriteList = document.getElementById('favorite-coins-list');
    favoriteList.innerHTML = '';

    favorites.forEach(symbol => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${symbol}
            <button onclick="removeFromFavorites('${symbol}')">Çıkar</button>
        `;
        favoriteList.appendChild(listItem);
    });
}

function buyCoin(symbol, price) {
    const maxBuyable = Math.floor(balance / price);
    const quantity = parseFloat(prompt(`Kaç adet ${symbol} almak istiyorsunuz?(Maks: ${maxBuyable}) Maksimum almak için 'max' yazabilirsiniz.`));

    //const finalQuantity = quantity.toLowerCase() === 'max' ? maxBuyable : parseInt(quantity, 10);

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

    //const finalQuantity = quantity.toLowerCase() === 'max' ? maxSellable : parseInt(quantity, 10);

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
        const latestPrice = parseFloat(getLatestPrice(symbol));
        if (!isNaN(latestPrice)) {
            const totalValue = quantity * latestPrice;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${symbol}</td>
                <td>${parseFloat(quantity)}</td>
                <td>${totalValue.toFixed(5)}</td>
            `;
            tableBody.appendChild(row);
        } else {
            console.error(`${symbol} için geçerli bir fiyat bulunamadı.`);
        }
    }
}

function getLatestPrice(symbol) {
    const row = Array.from(document.querySelectorAll('#major-coins-data tr')).find(row => row.cells[0].textContent === symbol);
    return row ? parseFloat(row.cells[1].textContent) : 0;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('virtual-balance').textContent = balance.toFixed(5);
    fetchData();
    fetchTopMovers();
});
