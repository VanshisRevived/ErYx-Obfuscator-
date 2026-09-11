const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// ==========================================
// 1. YOUR SCRIPT CONFIGURATION
// ==========================================
const SCRIPT_NAME = "My Custom Hub";
const ACCESS_PASSWORD = "MySecretPassword123";

const LUA_SCRIPT_PAYLOAD = `
--[[ 
    Loaded: ${SCRIPT_NAME}
]]--
print("Successfully loaded ${SCRIPT_NAME} via Executor!")
game:GetService("StarterGui"):SetCore("SendNotification", {
    Title = "${SCRIPT_NAME}",
    Text = "Script executed successfully!",
    Duration = 5
})
`;

// ==========================================
// 2. HELPER FUNCTION TO DETECT BROWSERS
// ==========================================
function isWebBrowser(req) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    
    // Check if the user agent contains standard web browser keywords
    const browserKeywords = ['mozilla', 'chrome', 'safari', 'edge', 'firefox', 'opera'];
    return browserKeywords.some(keyword => userAgent.includes(keyword));
}

// ==========================================
// 3. MAIN ROUTE (AUTOMATIC DETECTOR)
// ==========================================
app.get('/', (req, res) => {
    // IF VISITED FROM A WEB BROWSER -> SHOW PASSWORD SCREEN
    if (isWebBrowser(req)) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }

    // IF VISITED FROM DELTA / EXECUTOR HTTPGET -> SERVE RAW SCRIPT
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(LUA_SCRIPT_PAYLOAD);
});

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// Get script details (for UI displaying the Script Name)
app.get('/api/info', (req, res) => {
    res.json({ name: SCRIPT_NAME });
});

// Verify password submitted from web UI
app.post('/api/verify', (req, res) => {
    const { password } = req.body;
    if (password === ACCESS_PASSWORD) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(LUA_SCRIPT_PAYLOAD);
    }
    return res.status(401).json({ error: "Incorrect Password" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
