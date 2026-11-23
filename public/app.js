const place = { name: "Kigali", lat: -1.94, lon: 30.06};

function add(parent, tag, text) {
    const el = document.createElement(tag);
    el.textContent = text;
    parent.appendChild(el);
    return el;
}

function showError(text) {
    document.getElementById("message").textContent = text;
}

function conditionText(code) {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 48) return "Fog";
    if (code <= 57) return "Drizzle";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow"; 
    if (code <= 82) return "Rain showers";
    if (code <= 86) return "Snow showers";
    if (code >= 95) return "Thunderstorm";
    return "Unknown"; 
}

function showCurrent(c, name) {
    const box = document.getElementById("current");
    box.textContent = "";
    add(box, "h2", name);
    add(box, "p", c.temperature_2m + " °C, " + conditionText(c.weather_code));
    add(box, "p", "Humidity: " + c.relative_humidity_2m + " % ");
    add(box, "p", "Wind: " + c.wind_speed_10m + " km/h ");
}

function showForecast(d) {
    const list = document.getElementById("forecast");
    list.textContent = "";
    d.time.forEach((date, i) => {
        add(list, "li", 
            `${date}: ${d.temperature_2m_max[i]}/${d.temperature_2m_min[i]} °C, ` + 
            `rain ${d.precipitation_sum[i]} mm, gust ${d.wind_gusts_10m_max[i]} km/h, ` + 
            conditionText(d.weather_code[i]));
    });
}

async function loadWeather(p) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + p.lat +
    "&longitude=" + p.lon +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max" +
    "&timezone=auto&forecast_days=7";
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(data);
        showCurrent(data.current, p.name);
        showForecast(data.daily);
    } catch {
        showError("Could not load the weather.");
    }
}

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

loadWeather(place);
showServer();