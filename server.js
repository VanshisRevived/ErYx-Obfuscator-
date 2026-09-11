const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Master password to allow script uploads
const UPLOAD_PASSWORD = "EryxSecretKey123";

// In-memory database for uploaded scripts
const SCRIPT_DATABASE = {};

// 1. Web UI Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API Endpoint to Upload and Store Scripts
app.post('/api/upload', (req, res) => {
    const { name, description, script, password } = req.body;

    if (password !== UPLOAD_PASSWORD) {
        return res.status(401).json({ error: "Invalid Upload Key Password" });
    }

    if (!name || !script) {
        return res.status(400).json({ error: "Script Name and Script Code are required." });
    }

    // Generate a unique 8-character ID for the raw script link
    const scriptId = crypto.randomBytes(4).toString('hex');

    // Save to server database
    SCRIPT_DATABASE[scriptId] = {
        name,
        description: description || "No description provided.",
        code: script,
        created: new Date().toISOString()
    };

    const host = req.get('host');
    const protocol = req.protocol;
    const rawLink = `${protocol}://${host}/raw/${scriptId}`;

    return res.status(200).json({
        success: true,
        scriptId,
        rawLink
    });
});

// 3. Raw Execution Endpoint (Returns 403 on standard browser inspection)
app.get('/raw/:id', (req, res) => {
    const scriptId = req.params.id;
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';

    const scriptData = SCRIPT_DATABASE[scriptId];

    if (!scriptData) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('-- ErYx Error: Script ID not found or expired.');
    }

    // Detect browser traffic (skidders opening link directly in Chrome, Firefox, Edge, etc.)
    const isBrowser = acceptHeader.includes('text/html') || 
                      userAgent.includes('Mozilla') || 
                      userAgent.includes('Chrome') || 
                      userAgent.includes('Safari');

    if (isBrowser) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send('403 Forbidden: Access denied. Direct browser viewing is blocked.');
    }

    // Allowed execution request (Roblox HttpService / Executors)
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(scriptData.code);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ErYx Obfuscator Engine live on port ${PORT}`));
