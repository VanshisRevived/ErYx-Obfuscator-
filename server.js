const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// PASTE YOUR REAL LUA SCRIPT HERE
const SECRET_LUA_SCRIPT = `
-- [[ Protected ErYx Script ]] --
print("ErYx Core Executed Successfully!")
game:GetService("StarterGui"):SetCore("SendNotification", {
    Title = "ErYx Hub",
    Text = "Script Loaded Successfully!",
    Duration = 5
})
`;

// Served when someone opens the raw link directly in Chrome/Edge/Firefox
const ACCESS_DENIED_PAGE = `
<!DOCTYPE html>
<html>
<head>
    <title>ErYx Security | Protected Endpoint</title>
    <style>
        body { background-color: #0b0c10; color: #ff4d4d; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1f2833; padding: 2rem; border-radius: 8px; border: 1px solid #ff4d4d; text-align: center; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #c5c6c7; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>403 Forbidden</h1>
        <p>Direct browser access to raw source endpoint is blocked by ErYx Core.</p>
    </div>
</body>
</html>
`;

// The main URL everyone uses in their loadstring
app.get('/raw', (req, res) => {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    // Check if request comes from standard web browsers
    const isBrowser = userAgent.includes('mozilla') || 
                      userAgent.includes('chrome') || 
                      userAgent.includes('safari') || 
                      userAgent.includes('edge');

    if (isBrowser) {
        // Return 403 Forbidden page if someone checks the link in a browser
        res.setHeader('Content-Type', 'text/html');
        return res.status(403).send(ACCESS_DENIED_PAGE);
    }

    // If request comes from Roblox / HttpGet, serve the real script
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(SECRET_LUA_SCRIPT);
});

// Fallback home endpoint
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(ACCESS_DENIED_PAGE);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ErYx Server Online on port ${PORT}`));
