const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set your custom key here
const ACCESS_PASSWORD = "EryxSecretKey123";

// Paste your raw Lua script inside the ticks below
const LUA_SCRIPT_PAYLOAD = `
--[[ 
    Protected by ErYx Obfuscator Core 
]]--
print("ErYx Core: Authentication Successful!")
game:GetService("StarterGui"):SetCore("SendNotification", {
    Title = "ErYx Loaded!",
    Text = "Script executed successfully.",
    Duration = 5
})
`;

// 1. Serve the UI when visiting in browser
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API route used by the Web UI
app.post('/api/verify', (req, res) => {
    const { password } = req.body;
    if (password === ACCESS_PASSWORD) {
        return res.status(200).send(LUA_SCRIPT_PAYLOAD);
    }
    return res.status(401).json({ error: "Invalid Key Provided" });
});

// 3. Raw execution endpoint for loadstring
app.get('/raw', (req, res) => {
    const key = req.query.key;
    if (key === ACCESS_PASSWORD) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(LUA_SCRIPT_PAYLOAD);
    }
    res.setHeader('Content-Type', 'text/plain');
    return res.status(401).send('-- ErYx Error: Access Denied. Invalid or missing key parameter.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ErYx Server operational on port ${PORT}`));
