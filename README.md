# 🌴 GTA VI OBS Overlays Suite (v0.0.4)

A modular, customizable OBS Studio Browser Source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** and built for **YouTube Live** creators.

🔗 **Live Setup & Testing Hub:** [https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html](https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html)

---

## ✨ What's New in v0.0.4
* **Module 3 — Shoutout Toast (`shoutout`):**
  * Triggered via your `!so @username` command in Streamer.bot.
  * Listens automatically to both the `viShoutOuts` Global Variable (`Misc.GlobalVariableUpdated`) and custom WebSocket broadcasts (`GTA_Shoutout`).
  * Includes the signature **Roll & Pop** avatar spin animation, left/right avatar flip layout, custom header title text, and solid fill option.
* **Module 2 — YouTube Alerts (`alerts`):**
  * Supports **New Subscriber**, **New Member** (`New Sponsor`), **Member Milestone**, **Membership Gift**, **Gift Membership Received**, **Super Chat**, **Super Sticker**, and **Jewels Gifted**.
* **Module 1 — Member Walk-On Card (`walkon`):**
  * Dynamic stat row builder, 3D avatar coin flip/spin, and fixed **Solid Fill (No Background Image)** toggle.
* **Flexible OBS Browser Source Output:**
  * Use the **Include Modules** dropdown in `setup.html` to generate a single **All Modules (Global Combined)** URL or separate URLs for **Walk-On Card Only**, **Alerts Box Only**, or **Shoutout Toast Only**.

---

## 📁 Project Folder Structure

```text
gta6-obs-overlays/
├── css/
│   └── overlays.css                   # Master stylesheet (Card + Alerts + Shoutout Toast)
├── js/
│   └── overlays.js                    # Shared WebSocket client, drag/resize studio & queue engines
├── assets/
│   └── gta6-bg.webp                   # GTA VI background texture asset
├── streamerbot/
│   ├── GTA_Master_Alerts.cs           # C# script for YouTube Alerts blocking queue
│   ├── GTA_Shoutout.cs                # C# script for !so Shoutout Toast command
│   └── GTA_LookupYouTubeUser.cs       # C# script for live User Variable testing in setup.html
├── gta-overlay.html                   # Unified OBS Browser Source
├── setup.html                         # 6-Tab Universal Setup & Testing Hub
└── README.md                          # Documentation
```
