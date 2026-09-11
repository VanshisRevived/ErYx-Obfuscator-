const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK safely
let serviceAccount;

if (process.env.FIREBASE_KEY) {
    try {
        // Option A: Parse JSON key passed via Render Environment Variable
        serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
    } catch (err) {
        console.error('Failed to parse FIREBASE_KEY environment variable:', err.message);
    }
} else {
    try {
        // Option B: Load local key file for local testing
        serviceAccount = require('./firebase-key.json');
    } catch (err) {
        console.log('firebase-key.json not found locally.');
    }
}

if (!serviceAccount) {
    console.error('CRITICAL ERROR: No valid Firebase credentials provided. Set FIREBASE_KEY env var in Render.');
    process.exit(1);
}

// Initialize Admin App
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('✔ Firebase Firestore initialized successfully!');

// Basic test route
app.get('/', (req, res) => {
    res.send('Server is running and Firebase is connected!');
});

// Example route using Firestore
app.get('/health', async (req, res) => {
    try {
        // Quick Firestore ping check
        await db.listCollections();
        res.json({ status: 'OK', database: 'Connected' });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
