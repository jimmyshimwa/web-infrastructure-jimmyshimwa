const place = { name: "Kigali", lat: -1.94, lon: 30.06};

const QUICK = [
    { name: "Kigali", lat: -1.94, lon: 30.06},
    { name: "Nairobi", lat: -1.29, lon: 36.82},
    { name: "Lagos", lat: 6.52, lon: 3.38},
    { name: "Accra", lat: 5.60, lon: -0.19},

];

const T = {
    rainWatch: 30,
    rainWarning: 50,
    heat: 35,
    gust: 40,
    droughtDays: 5,
    droughtRain: 1,
    stormCodes: [95, 96, 99],

};

let userType = "farmer";
let currentDays = [];

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
    const view = getView(days);
    if (view.length === 0) {
        add(list, "li", "No days match this filter.");
        return;
    }
    view.forEach((day) => {
        const li = add(list, "li",
            `${day.date}: ${day.tmax}/${day.tmin} °C, ` +
            `rain ${day.rain} mm, gust ${day.gust} km/h, ` +
            conditionText(day.code));
        const h = hazards(day, userType);
        if (h.level > 0) {
            const b = add(li, "span", h.label);
            b.className = "badge level" + h.level;
        }    
            
    });
    
}

async function loadWeather(p) {
    showError("");
    document.getElementById("matches").textContent = "";    
    
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
        currentDays = makeDays(data.daily);
        renderHazards();
    } catch {
        showError("Could not load the weather.");
    }
}

async function searchCity(text) {
    const name = text.trim().slice(0, 50);
    if (name === '') {
        showError("Please type a city name.");
        return;
    }
    try {
        const res = await fetch(
            "https://geocoding-api.open-meteo.com/v1/search?name=" + 
            encodeURIComponent(name) + "&count=5");     
            
        const data = await res.json();
        if (!data.results || data. results.length === 0) {
            showError("City not found. Check the spelling. ");
            return;
        }
        showMatches(data.results);     
        } catch {
            showError("Could not search for the city.");
        }
}     

function showMatches(results) {
    if (results.length === 1) {
        pickPlace(results[0]);
        return;
    }
    const list = document.getElementById("matches");
    list.textContent = "Several matches. Pick one: ";
    results.forEach((r) => {
        const label = [r.name, r.admin2, r.admin1, r.country].filter(Boolean).join(", ");
        const b = add(list, "button", label);
        b.onclick = () => pickPlace(r);
    });
}

function pickPlace(r) {
    loadWeather({ name: r.name, lat: r.latitude, lon: r.longitude });
}

function makeQuickButtons() {
    const box = document.getElementById("quick");
    QUICK.forEach((p) => {
        const b = add(box, "button", p.name);
        b.onclick = () => loadWeather(p);
    });
}

document.getElementById("search-form").onsubmit = (e) => {
    e.preventDefault();
    searchCity(document.getElementById("city").value);
};

document.getElementById("user-type").onchange = (e) => {
    userType = e.target.value;
    renderHazards();
};
document.getElementById("sort").onchange = renderHazards;
document.getElementById("filter").onchange = renderHazards;

function makeDays(d) {
    let dry = 0;
    return d.time.map((date, i) => {
        dry = d.precipitation_sum[i] < T.droughtRain ? dry + 1 : 0;
        return {
            date: date,
            rain: d.precipitation_sum[i],
            tmax: d.temperature_2m_max[i],
            tmin: d.temperature_2m_min[i],
            gust: d.wind_gusts_10m_max[i],
            code: d.weather_code[i],
            dryDays: dry,
        };
    });
}

function hazards(day, userType) {
    const miner = userType === "miner";
    const found = [];

    const rainAdvice = miner 
    ? "Flooding and landslide risk."
    : "Waterlogging risk. Delay planting or harvest.";
  
    if (day.rain >= T.rainWarning) {
        found.push({ level: 2, label: "Heavy rain warning", advice: rainAdvice });
    } else if (day.rain >= T.rainWatch) {
        found.push({ level: 1, label: "Heavy rain watch", advice: rainAdvice });
    }

if (day.tmax >= T.heat) {
    found.push({ level: 1, label: "Extreme heat watch", advice: miner 
        ? "Heat illness risk. Schedule breaks."
        : "Heat illness risk. Irrigate early." 
    });
}

if (T.stormCodes.includes(day.code)){
    found.push({level: 2, label : "Thunderstorm warning", advice: miner
        ? "Lightning risk. Halt surface work."
        : "Lightning risk. Stay out of the fields."
     });
}

if (day.gust >= T.gust) {
    found.push({ level:1, label: "Strong wind watch", advice: miner 
        ? "Dust. Secure equipment."
        : "Crop and spray damage."
    });
}

if (!miner && day.dryDays >= T.droughtDays) {
    found.push({ level: 1, label: "Drought watch",
        advice: "Dry spell of " + T.droughtDays + " or more days. Plan water use." 
    });
}

if (found.length === 0) return { level:0, label: "No hazard", advice: ""};

return found.reduce((a, b) => (b.level > a.level ? b : a));
}

function showAlerts(days) {
    const box = document.getElementById("alerts");
    box.textContent = "";
    let count = 0;
    days.forEach((day) => {
        const h = hazards(day, userType);
        if (h.level > 0) {
            const a = add(box, "div", day.date + ": " + h.label + ". " + h.advice)
            a.className = "alert level" + h.level;
            count++;
        }
    });
    if (count === 0) add(box, "p", "No hazards expected in the next 7 days.");
}

function addBadges(days) {
    const rows = document.querySelectorAll("#forecast li");
    rows.forEach((li, i) => {
        const old = li.querySelector(".badge");
        if (old) old.remove(); 
        const h = hazards(days[i], userType);
        if (h.level > 0) {
            const b = add(li, "span", h.label);
            b.className = "badge level" + h.level;
        }
    });
}

function renderHazards() {
    showAlerts(currentDays);
    showForecast(currentDays);
}

function getView(days) {
    const sprt = document.getElementById("sort").value;
    const filter = document.getElementById("filter").value;

    const view = days.filter((day) => {
        const level = hazards(day, userType).level;
        if (filter === "hazard") return level > 0;
        if (filter === "1" || filter === "2") return level === Number(filter);
        return true;
    });

    if (sort === "hazard") {
        view.sort((a, b) => 
        hazards(b, userType).level - hazards(a, userType).level || 
        a.date.localeCompare(b.date));
    }
    return view;
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

makeQuickButtons();
loadWeather(place);
showServer();