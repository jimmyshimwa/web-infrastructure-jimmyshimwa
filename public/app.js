async function showServer() {
    const el = document.getElementById("server");
    try {
        const res = await fetch("/api/server");
        const data = await res.json();
        el.textContent = data.server;
    } catch {
        el.textContent = "unknown";
    }
}

showServer();