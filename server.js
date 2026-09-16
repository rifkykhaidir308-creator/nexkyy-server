const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const logs = [];

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'online', name: 'NEXKYY Server' });
});

// Auth
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'kyxploit' && password === 'michan56438') {
        res.json({ token: 'nexkyy-' + Date.now() });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Kirim bug
app.post('/send', (req, res) => {
    const { target, bug, effect, severity, timestamp, sender } = req.body;
    console.log(`[BUG] ${sender} → ${target} : ${bug} (${effect})`);
    logs.push({ type: 'bug', target, bug, effect, timestamp });
    res.json({ ok: true, received: Date.now() });
});

// RAT execute
app.post('/rat/execute', (req, res) => {
    const { command, targets } = req.body;
    console.log(`[RAT] ${command} → ${targets.length} device`);
    const results = targets.map((t, i) => ({
        success: true,
        log: `${command} executed on ${t}`,
        target: t
    }));
    res.json({ results });
});

// Device status
app.post('/devices/status', (req, res) => {
    res.json({ devices: [] });
});

// Device control
app.post('/devices/control', (req, res) => {
    const { command, targets } = req.body;
    console.log(`[CTRL] ${command} → ${targets.length} device`);
    res.json({ ok: true, command, targets });
});

// Liat log
app.get('/logs', (req, res) => {
    res.json(logs.slice(-100));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server jalan di port ${PORT}`);
    console.log(`Cek: http://localhost:${PORT}`);
});0

