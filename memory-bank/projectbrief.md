# Project Brief: ctt-web

## Core Goal

Web dashboard frontend for the Code Time Tracker ecosystem.

## What It Does

- Personal analytics dashboard (coding time, language distribution, heatmap)
- Device management & API key lifecycle
- Real-time global leaderboard
- Multi-device sync visualization

## Business Model

- **`ctt-web` and `ctt-server` are fully open source and free** — the whole product, not a free tier.
- **The hosted sync service will be deployed by the project and is free as well** — best effort,
  with no uptime promise. There is no paid tier and nothing is for sale; donations are voluntary
  and carry no privileges.
- The site therefore presents **two paths**: run it yourself, or use the hosted instance once it
  opens — both free. The repository link is a first-class navigation entry, not a footer afterthought.

## Related Projects

- Backend: https://github.com/AhogeK/ctt-server (Spring Boot 4, JWT + API Key auth)
- Plugin: https://github.com/AhogeK/code-time-tracker (JetBrains IDE plugin)

## Target Users

Developers who use the CTT JetBrains plugin and want a web-based view of their coding statistics.
