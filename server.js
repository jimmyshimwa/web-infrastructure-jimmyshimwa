const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || "local";
const PUBLIC = path.join(__dirname, "public");


const ownCache = new Map();
const TEN_MIN = 10 * 60 * 1000;

function sendJson(res, status, obj) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(obj));
}

async function handleOwn(url, res) {
    const lat = parseFloat(url.searchParams.get("lat"));
    const lon = parseFloat(url.searchParams.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || 
            Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return sendJson(res, 400, { error: "Invalid coordinates." });
    }

    if (!process.env.OWM_KEY) {
        return sendJson(res, 503, { error: "OpenWeatherMap key is missing on the server." });
    }
    
    const key = lat.toFixed(2) + "," + lon.toFixed(2);
    const hit = ownCache.get(key);
    if (hit && Date.now() - hit.time < TEN_MIN) {
        return sendJson(res, 200 ,hit.body);
    }

    const api = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat +
    "&lon=" + lon + "&units=metric&appid=" + process.env.OWM_KEY;
    try {
        const r = await fetch(api, {signal: AbortSignal.timeout(8000) });
        if (r.status === 401) {
            return sendJson(res, 401, { error: "OpenWeatherMap key is invalid or not active yet." });
        }
        if (r.status === 429) {
            return sendJson(res, 429, { error: "OpenWeatherMap rate limit reached. Try again soon." });
        }
        if (!r.ok) {
            return sendJson(res, 502, { error: "OpenWeatherMap is not working right now." });
        }
        const body = await r.json();
        if (ownCache.size > 200) ownCache.clear();
        ownCache.set(key, { time: Date.now(), body: body });
        sendJson(res, 200, body);
    } catch (err) {
        if (err.name === "TimeoutError") {
            return sendJson(res, 504, { error: "OpenWeatherMap took too long to answer."});
        }
        sendJson(res, 502, { error: "Could not reach OpenWeatherMap."});
    }
}
const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "text/javascript", 
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");


    if (url.pathname === "/api/server") {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
    });
    return res.end(JSON.stringify({ server: SERVER_NAME }));
}

if (url.pathname === "/api/owm") {
    return handleOwn(url, res);
}

const name = url.pathname === "/" ? "/index.html" : url.pathname;
let file; 
try {
    file = path.join(PUBLIC, decodeURIComponent(name));
} catch {
    res.writeHead(400);
    return res.end("Bad request");
}

// Block path
if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return  res.end("Forbidden");
}

fs.readFile(file, (err, data) => {
    if (err) {
        res.writeHead(404);
        return res.end("Not Found");
    }
    const ext = path.extname(file);
    const headers = { "Content-Type": TYPES[ext] || "application/octet-stream"};

    if (ext === ".css" || ext === ".js") {
        headers["Cache-Control"] = "public, max-age=300";
    }
    res.writeHead(200, headers);
    res.end(data);
});
});

server.listen (PORT, () => console.log("Running on http://localhost:" + PORT));