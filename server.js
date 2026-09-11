const express = require('express');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Master password to allow script uploads
const UPLOAD_PASSWORD = "EryxSecretKey123";

// 1. Initialize Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_KEY) {
    // Read key from environment variable (For Render production)
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} else {
    // Read key from local file (For local development)
    serviceAccount = require('./firebase-key.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const scriptsCollection = db.collection('scripts');

console.log('✔ Firebase Firestore initialized successfully!');

// 2. Serve Web UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. API Endpoint to Upload and Store Scripts in Firebase
app.post('/api/upload', async (req, res) => {
    const { name, description, script, password } = req.body;

    if (password !== UPLOAD_PASSWORD) {
        return res.status(401).json({ error: "Invalid Upload Key Password" });
    }

    if (!name || !script) {
        return res.status(400).json({ error: "Script Name and Script Code are required." });
    }

    try {
        // Generate a unique 8-character ID for the script
        const scriptId = crypto.randomBytes(4).toString('hex');

        // Save to Firebase Firestore
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

// 4. Raw Execution Endpoint (Returns 403 on standard browser inspection)
app.get('/raw/:id', async (req, res) => {
    const scriptId = req.params.id;
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';

    try {
        // Fetch script document from Firestore
        const doc = await scriptsCollection.doc(scriptId).get();

        if (!doc.exists) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(404).send('-- ErYx Error: Script ID not found or expired.');
        }

        const scriptData = doc.data();

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
    } catch (err) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).send('-- ErYx Error: Database read failure.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ErYx Obfuscator Engine live on port ${PORT}`));
