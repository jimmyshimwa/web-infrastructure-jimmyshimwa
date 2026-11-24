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
(to be filled in at M14)

## Run locally
(# Local test notes

Tested locally with `node --env-file=.env server.js` on http://localhost:3000.

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Click Kigali | Weather card, 7 rows, alert banner | |
| 2 | Click Nairobi | Same, for Nairobi | |
| 3 | Click Lagos | Same, for Lagos | |
| 4 | Click Accra | Same, for Accra | |
| 5 | Search "Kigali" | Picker with several matches, then weather after picking one | |
| 6 | Search "Zzzzzzqq" | "City not found. Check the spelling." | |
| 7 | Search with an empty box | "Please type a city name." | |
| 8 | Search `<b>hi</b>` | "Please use letters only..." and nothing breaks | |
| 9 | Paste 80 characters | Box stops at 50 characters | |
| 10 | Browser offline (DevTools, Network, Offline) | "You are offline. Check your internet connection." | |
| 11 | Slow request (timeout set to 1 ms) | "The request took too long. Try again." | |
| 12 | Server without OWM_KEY | Open-Meteo data shows, note says second opinion unavailable | |
| 13 | Wrong OWM_KEY | Note says the key is invalid or not active yet | |
| 14 | Click the same place twice | No new Open-Meteo request the second time (cache) | |
| 15 | Switch Farmer to Miner | Alerts and advice change, no reload | |
| 16 | Sort by hazard level, filter hazard days only | Rows reorder and filter correctly | |
| 17 | Phone width 375 px | No sideways scrolling, buttons easy to tap | |

## Deployment
(to be filled in at M14)

## Load balancer
(to be filled in at M14)

## APIs
(to be filled in at M14)

## Challenges and sollutions
- Setting up codeVibe for the second time was a struggle
- Sorting and filtering broke the badges, because I matched badges to rows by position. Fixed by drawing each row (and its badge) from the same sorted and filtered list of day objects.
- Server crashed with "Unexpected token" because I typed `If` instead of `if`. JavaScript is case sensitive. Fixed by correcting the keyword.
- VS Code auto-added `const { watch } = require("node:fs")` to app.js. Browsers have no `require`, so the whole script crashed. Fixed by deleting the line. Also fixed a typo `hazzards` and a missing `+`. Used the browser Console and `node --check` to find them.
- Sorting and filtering broke the badges, because I matched badges to rows by position. Fixed by drawing each row (and its badge) from the same sorted and filtered list of day objects.
- The proxy said the key was missing because the server must be started with `node --env-file=.env server.js`, and `.env` must contain `OWM_KEY`.
- VS Code auto-inserted require() lines in browser code and I put a `finally` block inside an `if`. A try/catch/finally must be three blocks at the same level. Also `navigator.onLine` needs a capital L. Found with node --check and VS Code warnings.
## Credits
(to be filled in at M14)

## Demo video
(link later)

## Deployed link
(link later)