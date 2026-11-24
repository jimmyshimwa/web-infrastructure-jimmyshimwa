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
    opinionGap: 10,
};

let userType = "farmer";
let currentDays = [];
let currentPlace = null;

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

function showForecast(days) {
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
        li.className = "sev" + h.level;
        if (h.level > 0) {
            const b = add(li, "span", h.label);
            b.className = "badge level" + h.level;
        }    
        if (typeof day.owm === "number") {
            add(li, "span", " | OpenWeatherMap rain: " + day.owm.toFixed(1) + " mm");
            if (forecastsDiffer(day)) {
                const f = add(li, "span", "Forecasts differ");
                f.className = "badge level1";
            }
        }
        makeRainBar(li, day.rain);
        makeTempBar(li, day.tmin, day.tmax);    
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
        const cacheKey = "forecast:" + p.lat.toFixed(2) + "," + p.lon.toFixed(2);
        let data = readCache(cacheKey);
        if (!data) {
            data = await fetchJson(url);
            checkForecast(data);
            saveCache(cacheKey, data);
        }
        showCurrent(data.current, p.name);
        currentPlace = p;
        currentDays = makeDays(data.daily);
        renderHazards();
        loadSecondOpinion(p);
    } catch (err) {
        clearResults();
        showError(err.message);
    }
}

async function searchCity(text) {
        const name = text.trim().replace(/\s+/g, " ").slice(0, 50);    if (name === '') {
        showError("Please type a city name.");
        return;
    }
    if (!/^[\p{L}\p{M}\s.'',-]+$/u.test(name)) {
        showError("Please use letters only. Numbers and symbols are not allowed.");
        return;
    }
    showError("");
    document.getElementById("matches").textContent = "";
    try {
        const data = await fetchJson(
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(name) + "&count=5");    
            
        if (!data || !Array.isArray(data.results) || data.results.length === 0) {
            showError("City not found. Check the spelling. ");
            return;
        }
        showMatches(data.results);     
        } catch (err){
            showError(err.message);
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
    debouncedSearch(document.getElementById("city").value);
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
            const a = add(box, "div", day.date + ": " + h.label + ". " + h.advice);
            a.className = "alert level" + h.level;
            count++;
        }
    });
    if (count === 0) add(box, "p", "No hazards expected in the next 7 days.");
}

function renderHazards() {
    showAlerts(currentDays);
    showForecast(currentDays);
}

function getView(days) {
    const sort = document.getElementById("sort").value;
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

function forecastsDiffer(day) {
    const bigGap = Math.abs(day.rain - day.owm) >= T.opinionGap;
    const onlyOne = (day.rain >= T.rainWatch) !== (day.owm >= T.rainWatch);
    return bigGap || onlyOne;
}

async function loadSecondOpinion(p) {
    const note = document.getElementById("second-opinion");
    note.textContent = "";
    try {
        const data = await fetchJson("/api/owm?lat=" + p.lat + "&lon=" +p.lon);
        if (currentPlace !== p) return;
        if (!Array.isArray(data.list) || !data.city) {
            throw new Error("OpenWeatherMap sent incomplete data.");
        }
        const rain = {};
        data.list.forEach((item) => {
            const date = new Date((item.dt + data.city.timezone) * 1000)
                .toISOString().slice(0, 10);
            const mm = item.rain && item.rain["3h"] ? item.rain["3h"] : 0;
            rain[date] = (rain[date] || 0) + mm;
        });
        currentDays.forEach((day) => {
            if (day.date in rain) day.owm = rain[day.date];
        });
        renderHazards();
    } catch (err) {
        if (currentPlace === p) {
            note.textContent = "Second opinion unavailable: " + err.message;
        }
    }
}

async function fetchJson(url) {

    if (!navigator.onLine) {
        throw new Error("You are offline. Check your internet connection.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res;
    try {
        res = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("The request took too long. Try again.");
        }
        throw new Error("Could not reach the service. Check your internet connection.");
    } finally {
            clearTimeout(timer);
        }

        if (!res.ok) {
            const body = await res.json().catch(() => null);
            if (body && typeof body.error === "string") throw new Error(body.error);
            if (res.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
            if (res.status === 401) throw new Error("The API key is invalid or not active yet.");
            throw new Error("The weather service is not working right now (error " + res.status + ").");
        }

        try {
            return await res.json();
        } catch {
            throw new Error("The service sent data we could not read.");
        }
}

function checkForecast(data) {
    const d = data && data.daily;
    const ok = data && data.current && d &&
        typeof data.current.temperature_2m === "number" &&
        Array.isArray(d.time) && d.time.length > 0 &&
        Array.isArray(d.precipitation_sum) &&
        Array.isArray(d.temperature_2m_max) &&
        Array.isArray(d.temperature_2m_min) &&
        Array.isArray(d.wind_gusts_10m_max) &&
        Array.isArray(d.weather_code);
    if (!ok) {
        throw new Error("The weather data is incomplete or in an unexpected format.");
    }                     
}        

function clearResults() {
    document.getElementById("current").textContent = "";
    document.getElementById("forecast").textContent = "";
    document.getElementById("alerts").textContent = "";
    document.getElementById("second-opinion").textContent = "";
}

window.addEventListener("offline", () => showError("You are offline. Check your internet connection."));
window.addEventListener("online", () => showError(""));

const TEMP_MIN = 0;
const TEMP_MAX = 40;

function pct(value) {
    return Math.min(100, Math.max(0, value));
}

function makeRainBar(parent, mm) {
    add(parent, "div", "Rain " + mm + " mm").className = "bar-label";
    const track = add(parent, "div", "");
    track.className = "bar-track";
    const fill = add(track, "div", "");
    const color = mm >= T.rainWarning ? "warning" : mm >= T.rainWatch ? "watch" : "rain";
    fill.className = "bar-fill " + color;
    fill.style.width = pct(mm / T.rainWarning * 100) + "%";
}

function makeTempBar(parent, tmin, tmax) {
    add(parent, "div", "Temperature " + tmin + " to " + tmax + " °C").className = "bar-label";
    const track = add(parent, "div", "");
    track.className = "bar-track";
    const fill = add(track, "div", "");
    fill.className = "bar-fill temp";
    const  range = TEMP_MAX - TEMP_MIN;
    const left = pct((tmin - TEMP_MIN) / range * 100 );
    const right = pct((tmax - TEMP_MIN) / range * 100);
    fill.style.left = left + "%";
    fill.style.width = (right - left) + "%";
}

const CACHE_MS = 10 * 60 * 1000;

function readCache(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (saved && Date.now() - saved.time < CACHE_MS) {
            checkForecast(saved.data);
            return saved.data;
        }
    } catch {

    } return null;
}

function saveCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ time: Date.now(), data: data }))
    } catch {
        
    }
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

const debouncedSearch = debounce(searchCity, 400);


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