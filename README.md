# 🌴 GTA VI OBS Overlays Suite (v0.0.3)

A modular, customizable OBS Studio Browser Source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** and built specifically for **YouTube Live** creators.

---

## ✨ v0.0.3 Modules Update
* **Unified Overlay Output:** The `walkon-vi-card.html` file has been upgraded to a master `gta-overlay.html`.
* **Module Selection:** Choose to render just the Walk-On Card, just the YouTube Alerts, or a Global source with everything active via the `setup.html` dropdown.
* **YouTube Alerts Module:** Brand new GTA-styled alert boxes natively hook into Streamer.bot's YouTube WebSocket events for Subscribers, Members, Milestones, Gifts, Super Chats, Super Stickers, and Jewels.
* **Studio Drag & Drop:** Interactive `setup.html` preview lets you drag modules around the canvas and resize them via corner handles.

---

## 📁 Project Folder Structure

```text
gta6-obs-overlays/
├── css/
│   └── overlays.css         # Master stylesheet (Walk-on + Alerts styles)
├── js/
│   └── overlays.js          # Shared Streamer.bot WebSocket client & Queue engines
├── assets/
│   └── gta6-bg.webp         # GTA VI background asset
├── gta-overlay.html         # Unified OBS Browser Source (Replaces walkon-vi-card)
└── setup.html               # Universal Configuration & Live Testing Hub
```

---

## 🤖 Alerts Trigger Setup (Streamer.bot)

The new **Alerts Module** handles YouTube events in two distinct ways:

### Method A: Native Event Hooks (Zero Code Required!)
If you check **"Auto Start WebSocket Server"** in Streamer.bot, the overlay engine natively listens to Streamer.bot's standard YouTube broadcasts (`YouTube.NewSubscriber`, `YouTube.SuperChat`, etc.). You do not need to create any Actions in Streamer.bot for these to appear on stream—they just work instantly!

### Method B: Custom JSON Broadcast
If you prefer to pace your alerts using Streamer.bot's blocking queues, you can turn off the Native Hooks by changing the **SB Custom Alert Event** in the Alerts tab to `GTA_Alert`, and use the built-in **Websocket Broadcast Json** sub-action inside your Streamer.bot Actions with this exact payload:

```json
{
  "event": "GTA_Alert",
  "alertType": "superchat", 
  "triggerName": "%triggerName%",
  "userName": "%user%",
  "userProfileUrl": "%userProfileUrl%",
  "amount": "%amount%",
  "message": "%message%"
}
```
*(Valid `alertType` values: `sub`, `member`, `milestone`, `gift`, `giftRec`, `superchat`, `supersticker`, `jewels`)*
