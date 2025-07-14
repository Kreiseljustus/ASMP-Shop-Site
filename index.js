const express = require('express');
const app = express();
const fs = require("fs");

app.use(express.json());

const FILE_PATH = "items.json";
const PRICE_HISTORY_PATH = "priceHistory.json";

let items = loadItems();
let priceHistory = loadPriceHistory();
setInterval(() => {
    priceHistory = loadPriceHistory();
}, 30000);

app.get('/asmp', (req, res) => {
    res.redirect('/asmp/shops');
});

app.get('/asmp/shops', (req, res) => {
    console.log("Get request received");
    incrementVisit('shops');
    // Read the HTML template from index.html
    let html = fs.readFileSync(__dirname + '/index.html', 'utf-8');
    // Inject items and priceHistory as JSON into the template
    html = html.replace('<!--ITEMS_JSON-->', JSON.stringify(items));
    html = html.replace('<!--PRICE_HISTORY_JSON-->', JSON.stringify(priceHistory));
    res.send(html);
});

app.get('/asmp/waytones', (req, res) => {
    incrementVisit('waytones');
    res.sendFile(__dirname + '/waytones.html');
});

app.post('/asmp/post', (req, res) => {
    console.log("Got data")
    if (!Array.isArray(req.body)) {
        console.log("Invalid data format: " + req.body)
        return res.status(400).send("Invalid data format.");
    }

console.log(req.body)

    let newItems = req.body.map(item => ({
            Owner: item.Owner,
            position: item.position,
            price: item.price,
            item: item.item,
            amount: item.amount,
            dimension: item.dimension,
            action: item.action,
            timestamp: new Date().toISOString()
        }));

    // Update existing items or add new ones
    newItems.forEach(newItem => {
        const existingItemIndex = items.findIndex(item => 
            JSON.stringify(item.position) === JSON.stringify(newItem.position)
        );
        
        if (existingItemIndex !== -1) {
            // Update existing item
            items[existingItemIndex] = newItem;


                } else {
            // Add new item
            items.push(newItem);
        }
    });

    updatePriceHistory(items);
    saveItems();
    res.status(200).send("Data received and stored.");
});

app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Page Not Found</title>
            <style>
            @font-face {
                font-family: 'Minecraftia';
                src: url('Minecraftia-Regular.ttf') format('truetype')
            }
                body {
                    font-family: 'Minecraftia', Arial, sans-serif;
                    text-align: center;
                    padding: 50px;
                }
            </style>
        </head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p>Requested path: ${req.path}</p>
        </body>
        </html>
    `);
});

app.use(express.static(__dirname));

app.listen(49876, () => console.log('Server running on port 49876'));

function loadItems() {
    if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

function saveItems() {
    fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

function loadPriceHistory() {
    if (fs.existsSync(PRICE_HISTORY_PATH)) {
        const data = fs.readFileSync(PRICE_HISTORY_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

function savePriceHistory() {
    fs.writeFileSync(PRICE_HISTORY_PATH, JSON.stringify(priceHistory, null, 2), 'utf-8');
}

function updatePriceHistory(items) {
    const timestamp = new Date().toISOString();
    const itemPrices = {};

    items.forEach(item => {
        if (!itemPrices[item.item]) {
            itemPrices[item.item] = {
                totalPrice: 0,
                count: 0
            };
        }
        itemPrices[item.item].totalPrice += parseFloat(item.price);
        itemPrices[item.item].count += 1;
    });

    Object.keys(itemPrices).forEach(itemName => {
        if (!priceHistory[itemName]) {
            priceHistory[itemName] = { history: [] };
        }

        const averagePrice = itemPrices[itemName].totalPrice / itemPrices[itemName].count;
        
        // Only add to history if price changed or this is the first entry
        const lastEntry = priceHistory[itemName].history[priceHistory[itemName].history.length - 1];
        if (!lastEntry || lastEntry.averagePrice !== averagePrice) {
            priceHistory[itemName].history.push({
                timestamp: timestamp,
                averagePrice: averagePrice,
                numberOfShops: itemPrices[itemName].count
            });

            if (priceHistory[itemName].history.length > 30) {
                priceHistory[itemName].history.shift();
            }
        }
    });

    savePriceHistory();
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function loadVisits() {
    const VISITS_FILE = "visits.txt";
    if (fs.existsSync(VISITS_FILE)) {
        const data = fs.readFileSync(VISITS_FILE, 'utf-8');
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // If not JSON, migrate from old format (single number)
            const today = getToday();
            const count = parseInt(data);
            if (!isNaN(count)) {
                const migrated = { [today]: { shops: count } };
                saveVisits(migrated); // Save migration immediately
                return migrated;
            }
        }
    }
    return {};
}

function saveVisits(visits) {
    fs.writeFileSync('visits.txt', JSON.stringify(visits, null, 2), 'utf-8');
}

function incrementVisit(page) {
    const today = getToday();
    let visits = loadVisits();
    if (!visits[today]) visits[today] = {};
    if (!visits[today][page]) visits[today][page] = 0;
    visits[today][page]++;
    saveVisits(visits);
}