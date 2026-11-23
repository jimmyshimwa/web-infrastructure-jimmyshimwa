const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || "local";
const PUBLIC = path.join(__dirname, "public");

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