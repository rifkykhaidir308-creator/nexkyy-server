// NEXKYY XPLOIT API Server v5.5.8
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const USERNAME = process.env.NEXKYY_USER || 'kyxploit';
const PASSWORD = process.env.NEXKYY_PASS || 'michan56438';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Auth', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${req.ip}`);
    next();
});

function checkAuth(req, res, next) {
    const auth = req.headers['x-auth'] || req.headers['authorization'];
    if (!auth) return next();
    try {
        const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString();
        const [user, pass] = decoded.split(':');
        if (user !== USERNAME || pass !== PASSWORD) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Malformed auth header' });
    }
}

// ============ NOTIFICATIONS ============
let notifications = [];
let notifyId = 0;
const MAX_NOTIF = 200;

function addNotification(type, message, data) {
    notifyId++;
    notifications.push({
        id: notifyId,
        type: type,
        message: message,
        data: data || {},
        time: new Date().toISOString()
    });
    if (notifications.length > MAX_NOTIF) {
        notifications = notifications.slice(-MAX_NOTIF);
    }
    console.log(`[NOTIF #${notifyId}] ${type} → ${message}`);
}

// ============ STATE ============
let stats = {
    totalSent: 0,
    totalSuccess: 0,
    totalFailed: 0,
    startedAt: new Date().toISOString()
};

let deviceList = [
    { id: 'a73e4e7fb7040ca2', name: 'OPPO CPH2691', status: 'online', ip: '103.***.***.44', location: 'Jakarta' },
    { id: 'b8f2c1d9e5a3067b', name: 'Samsung A54', status: 'online', ip: '114.***.***.12', location: 'Bandung' },
    { id: 'c4d8e2f1a9b5c3e7', name: 'Xiaomi Redmi 12', status: 'offline', ip: '—', location: '—' },
    { id: 'd9e3f7a2b8c4d1e6', name: 'Realme C55', status: 'online', ip: '182.***.***.88', location: 'Surabaya' },
    { id: 'e1a5b9c3d7e2f8a4', name: 'Vivo Y36', status: 'offline', ip: '—', location: '—' },
    { id: 'f2b6c8d4e9a1f7b3', name: 'iPhone 13', status: 'online', ip: '125.***.***.31', location: 'Medan' }
];

function genId() { return crypto.randomBytes(8).toString('hex'); }
function randomBool(rate) { return Math.random() < (rate || 0.85); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

app.get('/', (req, res) => {
    res.json({
        name: 'NEXKYY XPLOIT API',
        version: '5.5.8',
        status: 'online',
        uptime: process.uptime(),
        stats: stats,
        notifyId: notifyId,
        endpoints: [
            'POST /send',
            'POST /rat/execute',
            'GET  /devices/status',
            'POST /devices/control',
            'GET  /notifications',
            'GET  /stats',
            'POST /reset'
        ]
    });
});

// ============ POST /send ============
app.post('/send', checkAuth, (req, res) => {
    const { target, bug, effect, severity, timestamp, sender } = req.body || {};
    if (!target || !bug) {
        return res.status(400).json({ success: false, error: 'Missing target or bug' });
    }
    stats.totalSent++;
    const success = randomBool(0.85);
    if (success) stats.totalSuccess++; else stats.totalFailed++;
    const id = genId();

    addNotification(
        'send',
        `Bug ${bug} → ${target}`,
        { id, target, bug, effect, severity, success, sender: sender || 'anonymous' }
    );

    res.json({
        success: success,
        id: id,
        target: target,
        bug: bug,
        effect: effect || 'unknown',
        severity: severity || 'medium',
        timestamp: timestamp || Date.now(),
        sender: sender || 'anonymous',
        message: success ? `Payload ${bug} delivered to ${target}` : `Failed to deliver ${bug} to ${target}`
    });
});

// ============ POST /rat/execute ============
app.post('/rat/execute', checkAuth, async (req, res) => {
    const { command, targets } = req.body || {};
    if (!command || !Array.isArray(targets)) {
        return res.status(400).json({ success: false, error: 'Missing command or targets array' });
    }
    const validCommands = ['camera', 'mic', 'location', 'files', 'sms', 'contacts', 'screen', 'keylog'];
    if (!validCommands.includes(command.toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Invalid command. Valid: ' + validCommands.join(', ') });
    }

    addNotification('rat', `RAT ${command.toUpperCase()} → ${targets.length} device`, { command, targets });

    const results = [];
    for (const targetId of targets) {
        const device = deviceList.find(d => d.id === targetId);
        const online = device && device.status === 'online';
        const success = online && randomBool(0.9);
        await sleep(150 + Math.random() * 200);
        results.push({
            id: targetId,
            success: success,
            log: success ? `${command.toUpperCase()} executed on ${device ? device.name : targetId}` : `Failed: device ${device ? 'offline' : 'not found'}`
        });
    }
    res.json({
        success: true,
        command: command,
        targetCount: targets.length,
        successCount: results.filter(r => r.success).length,
        results: results
    });
});

// ============ GET /devices/status ============
app.get('/devices/status', checkAuth, (req, res) => {
    deviceList.forEach(d => {
        if (Math.random() < 0.02) {
            d.status = d.status === 'online' ? 'offline' : 'online';
            if (d.status === 'offline') { d.ip = '—'; d.location = '—'; }
            else {
                d.ip = `${Math.floor(Math.random()*200+50)}.***.***.${Math.floor(Math.random()*200+10)}`;
                d.location = ['Jakarta','Bandung','Surabaya','Medan','Makassar'][Math.floor(Math.random()*5)];
            }
        }
    });
    const online = deviceList.filter(d => d.status === 'online').length;
    res.json({ devices: deviceList, total: deviceList.length, online: online, offline: deviceList.length - online, timestamp: Date.now() });
});

// ============ POST /devices/control ============
app.post('/devices/control', checkAuth, (req, res) => {
    const { command, targets } = req.body || {};
    if (!command || !Array.isArray(targets)) {
        return res.status(400).json({ success: false, error: 'Missing command or targets array' });
    }
    const validCommands = ['lock', 'wipe', 'alarm', 'screenshot', 'locate', 'reboot'];
    if (!validCommands.includes(command.toLowerCase())) {
        return res.status(400).json({ success: false, error: 'Invalid command. Valid: ' + validCommands.join(', ') });
    }
    const affected = [];
    for (const targetId of targets) {
        const device = deviceList.find(d => d.id === targetId);
        if (device && device.status === 'online') {
            affected.push({ id: targetId, name: device.name, command: command, success: true, executedAt: Date.now() });
        } else {
            affected.push({ id: targetId, success: false, error: 'Device offline or not found' });
        }
    }

    addNotification('device', `Control ${command.toUpperCase()} → ${affected.filter(a => a.success).length}/${targets.length}`, { command, targets });

    res.json({ success: true, command: command, targetCount: targets.length, affectedCount: affected.filter(a => a.success).length, affected: affected });
});

// ============ GET /notifications ============
app.get('/notifications', (req, res) => {
    const since = parseInt(req.query.since) || 0;
    const newNotifs = notifications.filter(n => n.id > since);
    res.json({
        latestId: notifyId,
        count: newNotifs.length,
        notifications: newNotifs
    });
});

app.get('/stats', (req, res) => { res.json(stats); });

app.post('/reset', checkAuth, (req, res) => {
    stats = { totalSent: 0, totalSuccess: 0, totalFailed: 0, startedAt: new Date().toISOString() };
    notifications = [];
    notifyId = 0;
    res.json({ success: true, message: 'Stats and notifications cleared' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('════════════════════════════════════════');
    console.log('  NEXKYY XPLOIT API v5.5.8');
    console.log('  Server running on port ' + PORT);
    console.log('  Bind: 0.0.0.0');
    console.log('  Notification system: ENABLED');
    console.log('════════════════════════════════════════');
});
