# Weather Hazard Planner

## Mission
Weather Hazard Planner gives African farmers and miners early, local
warnings about dangerous weather. With a few days of notice, they can
plan their work, stay safe, and adapt to climate change.
# Users and Hazards

## User groups

| User | What they depend on | Main weather risk |
|------|---------------------|-------------------|
| Farmer | Rain, heat and dry spells for planting, growing and harvest | Crop loss, waterlogging, drought |
| Miner | Safe ground and safe working conditions | Flooding, landslides, lightning, heat illness |

## Hazards and thresholds

All thresholds live in one object at the top of `app.js`.

| Hazard | Rule | Farmer advice | Miner advice |
|--------|------|---------------|--------------|
| Heavy rain | Watch at 30 mm/day or more. Warning at 50 mm/day or more. | Waterlogging risk. Delay planting or harvest. | Flooding and landslide risk. |
| Extreme heat | Max temperature 35 C or more | Heat stress. Irrigate early. | Heat illness risk. Schedule breaks. |
| Thunderstorm | WMO weather code 95, 96 or 99 | Stay out of the fields. | Lightning risk. Halt surface work. |
| Strong wind or dust | Gusts 40 km/h or more | Crop and spray damage. | Dust. Secure equipment. |
| Drought | 5 or more days in a row under 1 mm rain | Plan water use and irrigation. | Not used for miners. |

## Alert levels

- 0 = none
- 1 = watch (yellow)
- 2 = warning (red)

## Limits and honesty

- Thresholds are illustrative and not official.
- Forecast accuracy comes from the weather models of the APIs, not from this app.
- Always follow official national meteorological warnings.
- Version 1 uses forecast data only. Later versions could add local sensors, satellite data and community reports.

## What it does
Weather Hazard Planner shows today's weather and a 7 day forecast for a place you choose.
You pick "farmer" or "miner", and the app flags days that could be dangerous for your work:
- Farmers: heavy rain, extreme heat, strong wind, thunderstorms, drought.
- Miners: heavy rain (flooding and landslide risk), extreme heat, strong wind, thunderstorms.

You can search a city, sort days by risk, and filter to hazard days only.
A second forecast from OpenWeatherMap is compared with Open-Meteo, and the app shows "Forecasts differ" when they disagree.
## Run locally
Requirements: Node.js 20 or newer, and a free OpenWeatherMap key.

1. Clone the repo: `git clone https://github.com/jimmyshimwa/web-infrastructure-jimmyshimwa.git`
2. Go into the folder.
3. Copy `.env.example` to `.env`.
4. Open `.env` and put your key after `OWM_KEY=`.
5. Start the server: `node --env-file=.env server.js`
6. Open `http://localhost:3000`.
Tested locally with `node --env-file=.env server.js` on http://localhost:3000.

## Deployment
The app runs on two web servers behind one load balancer:
- web-01: 18.171.159.225 (`SERVER_NAME=web01`)
- web-02: 13.135.252.195 (`SERVER_NAME=web02`)
- lb-01: 35.178.212.114 (load balancer)

Deployed URL: http://35.178.212.114

Steps on web-01 and web-02 (Ubuntu 20.04 ARM, user `ubuntu`):
1. Connect with SSH. My public key was saved in my intranet profile.
2. `sudo apt-get update` then `sudo apt-get install -y nginx git curl xz-utils`
3. Install Node 20 from nodejs.org. These servers are ARM, so I used the `linux-arm64` build and extracted it into `/usr/local`.
4. `sudo git clonehttps://github.com/jimmyshimwa/web-infrastructure-jimmyshimwa.git /var/www/weather`, then `sudo chown -R ubuntu:ubuntu /var/www/weather`
5. Create `.env` from `.env.example` with `OWM_KEY`, `SERVER_NAME` (`web01` or `web02`) and `PORT=3000`. Run `chmod 600 .env`.
6. Copy `deploy/weather.service` to `/etc/systemd/system/`, then `sudo systemctl daemon-reload` and `sudo systemctl enable --now weather`.
7. Copy `deploy/nginx-web.conf` to `/etc/nginx/sites-available/weather`, link it into `sites-enabled`, remove the default site, then `sudo nginx -t` and `sudo systemctl reload nginx`.
8. Test: `curl http://127.0.0.1/api/server`
## Load balancer
On lb-01 I installed Nginx and used `deploy/nginx-lb.conf`. It lists both web servers in an `upstream` block, so Nginx uses round robin. If one server gives an error, `proxy_next_upstream` tells it to try the other one.

Setup on lb-01:
1. `sudo apt-get update` then `sudo apt-get install -y nginx`
2. Copy `deploy/nginx-lb.conf` to `/etc/nginx/conf.d/weather-lb.conf`.
3. Remove the default site: `sudo rm -f /etc/nginx/sites-enabled/default`
4. Check the config: `sudo nginx -t`
5. Reload: `sudo systemctl reload nginx`

Test: `for i in 1 2 3 4 5 6; do curl -s http://35.178.212.114/api/server; echo; done`

Result (the answers alternate between the two servers):

## APIs
- Open-Meteo Forecast API: https://open-meteo.com/en/docs (no key needed)
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api (no key needed)
- OpenWeatherMap 5 day forecast: https://openweathermap.org/forecast5 (free key needed)
- Open-Meteo: no key required.
- OpenWeatherMap: the key is given to the grader in the submission comment box. It is not in this repo.
- App login: none required.
- I chose Open-Meteo and OpenWeatherMap because they provide the weather data my app needs (rain, temperature, wind). Open-Meteo needs no key. OpenWeatherMap gives a second source to compare.
- Both are called over HTTPS, and both have official documentation (links above).
- I read the pricing pages. Open-Meteo's free plan is for non-commercial use, with limits of 600 calls per minute and 10,000 per day. OpenWeatherMap's free plan allows 60 calls per minute and 1,000,000 per month, and includes the 5 day / 3 hour forecast.
- Open-Meteo data is licensed CC BY 4.0, so I credit it in the app footer and in this README.
- I cache results for 10 minutes, so my app stays well under both limits.
- My OpenWeatherMap key is only used on my server. It is never in the browser code or in the repo.
- Open-Meteo Forecast API: https://open-meteo.com/en/docs (no key needed)
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api (no key needed)
- OpenWeatherMap 5 day forecast: https://openweathermap.org/forecast5 (free key needed)
## API keys and credentials
- Open-Meteo: no key required.
- OpenWeatherMap: the key is given to the grader in the submission comment box. It is not in this repo.
- To use your own key: create a free account at openweathermap.org, copy `.env.example` to `.env`, and set `OWM_KEY=`.
- My OpenWeatherMap key is only used on my server. It is never in the browser code or in the repo.
- App login: none required.

## Challenges and solutions
- Setting up codeVibe for the second time was a struggle
- Sorting and filtering broke the badges, because I matched badges to rows by position. Fixed by drawing each row (and its badge) from the same sorted and filtered list of day objects.
- Server crashed with "Unexpected token" because I typed `If` instead of `if`. JavaScript is case sensitive. Fixed by correcting the keyword.
- VS Code auto-added `const { watch } = require("node:fs")` to app.js. Browsers have no `require`, so the whole script crashed. Fixed by deleting the line. Also fixed a typo `hazzards` and a missing `+`. Used the browser Console and `node --check` to find them.
- Sorting and filtering broke the badges, because I matched badges to rows by position. Fixed by drawing each row (and its badge) from the same sorted and filtered list of day objects.
- The proxy said the key was missing because the server must be started with `node --env-file=.env server.js`, and `.env` must contain `OWM_KEY`.
- VS Code auto-inserted require() lines in browser code and I put a `finally` block inside an `if`. A try/catch/finally must be three blocks at the same level. Also `navigator.onLine` needs a capital L. Found with node --check and VS Code warnings.
## Credits
- Weather data: Open-Meteo (https://open-meteo.com), licensed CC BY 4.0.
- Second forecast: OpenWeatherMap (https://openweathermap.org).
- Learning resources: MDN Web Docs, Node.js docs.
## Demo video
(link later)

## Deployed link
(link later)