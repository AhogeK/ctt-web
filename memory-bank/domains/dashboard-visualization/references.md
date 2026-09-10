# dashboard-visualization — references

Lookup facts. No judgement here — decisions live in `principles.md` / `scenarios.md`.

## Panels and their data sources

| Panel (card title)                 | Component                        | Data source (see backend-contract)                 | Window follows filter bar |
| ---------------------------------- | -------------------------------- | -------------------------------------------------- | ------------------------- |
| Coding heatmap                     | `HeatmapChart.vue`               | `stats/heatmap` + `stats/heatmap-years`            | No — owned by `?year=`    |
| Weekly coding activity by hour     | `WeekHourPanel.vue`              | `stats/week-hour`                                  | Yes                       |
| Average hourly coding duration     | `HourlyPanel.vue`                | `stats/hourly`                                     | Yes                       |
| Coding trend (last 30 days)        | `TrendChart.vue`                 | `stats/heatmap` (30-day window)                    | No — fixed 30 days        |
| Time of day distribution           | `TimeOfDayPanel.vue`             | `stats/distribution?type=TIME_OF_DAY`              | Yes                       |
| Language distribution              | `LanguageDistributionPanel.vue`  | `stats/distribution?type=LANGUAGES`                | Yes                       |
| Summary cards (6 fields)           | `SummaryCards.vue`               | `stats/summary`                                    | n/a — fixed windows       |

Panels not yet built but available server-side: `PROJECTS`, `WEEKDAY`, `DEVICES`, `IDES`.

## Colour values in use

### Time of day capsule (4 buckets)

| Bucket  | Light     | Dark      | Clock range (local) |
| ------- | --------- | --------- | ------------------- |
| Night   | `#1e2260` | `#333b9a` | 00–06               |
| Morning | `#3f4ab0` | `#4d59c9` | 06–12               |
| Daytime | `#939ff0` | `#bcc5ff` | 12–18               |
| Evening | `#5e6ad2` | `#8b95ea` | 18–24               |

### General bar/area gradient (shared with the trend chart)

| Role          | Light     | Dark      |
| ------------- | --------- | --------- |
| Deep end (0%) | `#3d49ad` | `#4f58c0` |
| Mid (48%)     | `#8290f0` | `#8290f0` |
| Bright (100%) | `#8a97f2` | `#b9c1ff` |

The dark deep end is nudged from the trend chart's `#4a53b8` only to clear 3:1 on the track.

### Week-hour / heatmap ramps

| Element            | Light                        | Dark                          |
| ------------------ | ---------------------------- | ----------------------------- |
| Heatmap buckets    | `#d9ddf2 → #2f3a9e` (6 steps) | `#313a5c → #bcc2f4` (6 steps) |
| Week-hour quiet    | `#e9ebf0`                    | `#26282b`                     |
| Week-hour mid-stop | `#5e6ad2` (brand anchor)     | `#5e6ad2`                     |

## Layout thresholds (measured)

| Viewport | Panel card width | Panel columns | Summary row width | Summary columns |
| -------- | ---------------- | ------------- | ----------------- | --------------- |
| 1600     | —                | 1             | 1296              | 3               |
| 1920     | 796              | 1             | 1616              | 6               |
| 2048     | 860              | 2             | 1744              | 6               |
| 2621     | 1147             | 2             | 2317              | 6               |

Floors: panel card ≥830px (row ≥1684px), summary row ≥1430px.

## Interaction parameters

| Parameter                | Value                                                          |
| ------------------------ | -------------------------------------------------------------- |
| Scroll viewport max-h    | `19rem`                                                        |
| Scrollbar width          | `thin` (Chrome renders an 11px lane)                           |
| Thumb idle-hide delay    | ~900ms                                                         |
| Edge fade depth          | ~18px top / ~26px bottom                                       |
| Row stagger (entrance)   | 45–55ms per row, `IntersectionObserver` threshold .25           |
| Segment seam width       | 1.5–2px, card-surface colour                                   |

## Files worth knowing

| Path                                                       | Why                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `src/components/charts/echarts-setup.ts`                   | Sole ECharts registration point (tree-shaken)             |
| `src/features/dashboard/components/axis-scale.ts`          | Shared Y-scale helper used by trend + hourly               |
| `src/features/dashboard/components/heatmap-window.ts`      | Pure helpers: 366-point leap handling, 53/54-column count   |
| `e2e/dashboard/heatmap-layout.spec.ts`                     | Locks the layout threshold contract                        |
| `DESIGN.md` (repo root)                                    | Authoritative visual spec                                  |

## Local verification addresses

- Dev server `http://localhost:5173/` (dashboard at `/dashboard`)
- Backend `http://localhost:8080/ctt-server` (swagger at `/swagger-ui`)
- Mail capture `http://localhost:8025` (mailpit)
