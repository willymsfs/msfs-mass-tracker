const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = 'data.json';

// Load data
let db = {};
if (fs.existsSync(DATA_FILE)) {
    db = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    // Initialize with default data
    db = {
        masses: {},
        suffrages: [],
        receptions: [],
        personalIntentions: {},
        settings: {
            currentSerial: 0,
            fixedIntentions: [
                // ... your fixed intentions
            ],
            goodFridays: ["2024-03-29", "2025-04-18", "2026-04-03"]
        }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));
}

// Save helper
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));
}

// API endpoints
app.get('/api/masses', (req, res) => {
    res.json(db.masses);
});

app.post('/api/masses', (req, res) => {
    const mass = req.body;
    db.masses[mass.date] = mass;
    saveData();
    res.json({ success: true });
});

// Add similar endpoints for suffrages, receptions, etc.

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
