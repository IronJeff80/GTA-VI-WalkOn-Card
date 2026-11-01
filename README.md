# 🌴 GTA VI OBS Overlays Suite (v0.1.0)

A modular, customizable OBS Studio Browser Source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** and built for **YouTube Live** creators.

🔗 **Live Setup & Testing Hub:** [https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html](https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html)

---

## ✨ What's New in v0.1.0
* **Multi-Language Support:** Localized defaults for English (`en`), Portuguese (`pt-br`), Spanish (`es`), French (`fr`), and German (`de`) configurable via `setup.html`.
* **Dual Horizontal & Vertical Canvas Scaling:** 
  * Automatically scales for `720p`, `1080p`, `1440p`, and `2160p (4K)`.
  * Generates two independent OBS URLs: one for Horizontal (16:9) and one for Vertical (9:16).
  * Interactive **Dual Preview** mode in the Studio Setup to position components side-by-side.
* **Module Checklists:** You can now toggle exact combinations of modules to bundle into a single OBS Browser Source (e.g., Alerts + Chat).
* **Module 4 — Horizontal Chat Bar (`chat`):** A sleek, horizontal scrolling chat bar with custom role colors, command filtering, and dynamic user/group ignoring.
* **Module 5 — Q&A / Chat Highlight Toast (`qa`):** Dedicated UI for spotlighting chat messages, hooked to `viChatHighlight`.
* **Module 3 — Shoutout Toast (`shoutout`):** Independent accent colors, dynamic geometry matching, and Streamer.bot integration (`viShoutOuts`).
* **Module 2 — YouTube Alerts (`alerts`):** Independent accent colors for each alert type (Teal, Pink, Purple, Yellow).
* **Module 1 — Member Walk-On Card (`walkon`):** Dynamic 3D avatar coin flip/spin and configurable text variables.

---

## 📁 Project Folder Structure

```text
gta6-obs-overlays/
├── css/
│   └── overlays.css                   # Master stylesheet (All 5 Modules)
├── js/
│   └── overlays.js                    # Core logic, i18n, Dual Canvas scaling, WebSocket Engine
├── assets/
│   └── gta6-bg.webp                   # GTA VI background texture asset
├── streamerbot/
│   ├── GTA_Master_Alerts.cs           # C# script for YouTube Alerts blocking queue
│   ├── GTA_Shoutout.cs                # C# script for !so Shoutout Toast command
│   ├── GTA_QA_Highlight.cs            # C# script for Q&A Message Highlight Quick Action
│   └── GTA_LookupYouTubeUser.cs       # C# script for live User Variable testing in setup.html
├── gta-overlay.html                   # Unified OBS Browser Source
├── setup.html                         # 8-Tab Universal Setup & Testing Hub
└── README.md                          # Documentation
```
