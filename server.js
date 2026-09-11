const express = require('express');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Master password to allow script uploads
const UPLOAD_PASSWORD = "EryxSecretKey123";

// Initialize Firebase Admin SDK safely
let serviceAccount;

if (process.env.FIREBASE_KEY) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    } catch (err) {
        console.error('Failed to parse FIREBASE_KEY environment variable:', err.message);
    }
} else {
    try {
        serviceAccount = require('./firebase-key.json');
    } catch (err) {
        console.log('firebase-key.json not found locally.');
    }
}

if (!serviceAccount) {
    console.error('CRITICAL ERROR: No valid Firebase credentials provided. Set FIREBASE_KEY env var in Render.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const scriptsCollection = db.collection('scripts');

console.log('✔ Firebase Firestore initialized successfully!');

// 1. Serve Web UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API Endpoint to Upload and Store Scripts in Firebase
app.post('/api/upload', async (req, res) => {
    const { name, description, script, password } = req.body;

    if (password !== UPLOAD_PASSWORD) {
        return res.status(401).json({ error: "Invalid Upload Key Password" });
    }

    if (!name || !script) {
        return res.status(400).json({ error: "Script Name and Script Code are required." });
    }

    try {
        const scriptId = crypto.randomBytes(4).toString('hex');

        await scriptsCollection.doc(scriptId).set({
            scriptId,
            name,
            description: description || "No description provided.",
            code: script,
            createdAt: new Date().toISOString()
        });

        const host = req.get('host');
        const protocol = req.protocol;
        const rawLink = `${protocol}://${host}/raw/${scriptId}`;

        return res.status(200).json({
            success: true,
            scriptId,
            rawLink
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Firebase error occurred while saving script." });
    }
});

// 3. Raw Execution Endpoint (Returns 403 on standard browser inspection)
app.get('/raw/:id', async (req, res) => {
    const scriptId = req.params.id;
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';

    try {
        const doc = await scriptsCollection.doc(scriptId).get();

        if (!doc.exists) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send('-- ErYx Error: Script ID not found or expired.');
        }

        const scriptData = doc.data();

        // Block browser traffic (skidders inspecting link directly in Chrome/Edge/Firefox)
        const isBrowser = acceptHeader.includes('text/html') || 
                          userAgent.includes('Mozilla') || 
                          userAgent.includes('Chrome') || 
                          userAgent.includes('Safari');

        if (isBrowser) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(403).send('403 Forbidden: Access denied. Direct browser viewing is blocked.');
        }

        // Allowed execution request for Roblox HttpService / Executors
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(scriptData.code);
    } catch (err) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send('-- ErYx Error: Database read failure.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ErYx Obfuscator Engine live on port ${PORT}`));
