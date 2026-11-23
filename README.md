# Weather Hazard Planner

## Mission
Weather Hazard Planner gives African farmers and miners early, local
warnings about dangerous weather. With a few days of notice, they can
plan their work, stay safe, and adapt to climate change.
# Users and Hazards (Version 1)

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
(to be filled in at M14)

## Deployment
(to be filled in at M14)

## Load balancer
(to be filled in at M14)

## APIs
(to be filled in at M14)

## Challenges
- Setting up codeVibe for the second time was a struggle

## Credits
(to be filled in at M14)

## Demo video
(link later)

## Deployed link
(link later)