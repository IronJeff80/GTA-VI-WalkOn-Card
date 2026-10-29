# 🌴 GTA VI OBS Overlays & Graphics Suite

A modular, customizable OBS Studio Browser Source overlay suite inspired by the official **Grand Theft Auto VI** HUD and Vice City / Leonida aesthetics. Powered by **Streamer.bot WebSockets** and built specifically for **YouTube Live** creators.

---

## ✨ Features

* **Authentic GTA VI Palette & HUD Styling:** Extracted directly from official GTA VI gameplay and promotional art.
* **Shared Modular Architecture:** Single master stylesheet (`css/overlays.css`) and core JavaScript engine (`js/overlays.js`) designed to power multiple overlays without duplicating code.
* **Universal Setup & Live Testing Hub (`setup.html`):**
  * Configure card coordinates, scale, display duration, fonts, and custom backgrounds visually.
  * Choose between multiple entrance animations and 3D avatar effects (`3D Coin Flip`, `360° Spin`, `Elastic Pop`).
  * Map custom **Streamer.bot YouTube User Variables** and customize stat labels on the fly.
  * **Live Simulator:** Trigger random walk-on tests or pull real persisted user variables from your Streamer.bot instance in real time.
  * Generates a ready-to-paste **OBS Browser Source URL** with all settings saved as URL parameters.

---

## 📁 Project Folder Structure

```text
gta6-obs-overlays/
├── css/
│   └── overlays.css         # Shared master stylesheet, HUD tokens & keyframe animations
├── js/
│   └── overlays.js          # Shared URL parser, Streamer.bot WebSocket client & queue engine
├── assets/
│   └── gta6-bg.webp         # Optimized GTA VI sunset & palm silhouette background
├── walkon-vi-card.html      # Member Walk-On Card OBS Browser Source
├── setup.html               # Universal Configuration & Live Testing Hub
└── README.md                # Project documentation & setup guide
```

---

## 🎨 GTA VI Color Palette Reference

| Color Name | Hex Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Vice Pink** | `#f4acc4` | `--gta-pink` | Avatar outlines, primary accents, HUD heart icon |
| **Leonida Teal** | `#53d8bf` | `--gta-teal` | Top card border, left meta accent, HUD lungs/calendar icon |
| **Sunset Purple** | `#a688ff` | `--gta-purple` | Tier badges, HUD focus icon, secondary glows |
| **Solar Yellow** | `#fede9a` | `--gta-yellow` | Username typography, primary stat highlights |
| **Icon Stroke** | `#171a21` | `--gta-icon-stroke` | Heavy text strokes, inner card framing |
| **Border / Stroke** | `#0b2328` | `--gta-border` | Outer card borders, HUD icon rings |
| **BG / Alpha Fill** | `#303030` | `--gta-bg-fill` | Base card fill and dark translucent stat containers |

---

## 🚀 Quick Start Guide

### 1. Enable Streamer.bot WebSocket Server
1. Open **Streamer.bot**.
2. Navigate to **Servers/Clients** > **WebSocket Server**.
3. Check **Auto Start WebSocket Server** and click **Start Server**.
4. Note your **Address** (default: `127.0.0.1`) and **Port** (default: `8080`).

### 2. Configure Your Overlay (`setup.html`)
1. Open `setup.html` in any web browser (either locally or via your GitHub Pages URL).
2. Enter your Streamer.bot **WebSocket IP** and **Port**, then click **Connect SB**.
3. Customize your **Card Position**, **Scale**, **Animations**, **Fonts**, and **Stat Row Labels**.
4. Click **Simulate Random YouTube Walk-On** to preview the animations in the live canvas.
5. Click **Copy URL** at the top of the workspace to copy your personalized OBS Browser Source link.

### 3. Add to OBS Studio
1. In OBS Studio, add a new **Browser Source** to your scene.
2. Paste the copied URL into the **URL** field.
3. Set **Width** to `1920` and **Height** to `1080`.
4. Click **OK**.

---

## 🤖 Streamer.bot YouTube Setup

To trigger the Walk-On overlay when a YouTube member chats or joins, create an Action in Streamer.bot and add an **Execute C# Code** sub-action.

### Default Persisted YouTube User Variables
The overlay looks for the following variable names by default (all customizable in `setup.html`):

| Overlay Element | Default Variable Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| **Username** | `userName` | `String` | Populated automatically via `%user%` |
| **Avatar Image** | `avatarUrl` | `String` | Populated automatically via `%userProfileUrl%` |
| **Membership Tier** | `levelName` | `String` | Persisted YouTube user variable (e.g., `"Leonida VIP"`) |
| **Stat Row 1 (Tenure)** | `months` | `Int32` | Persisted YouTube user variable for total months subscribed |
| **Stat Row 2 (Joined)** | `memberSince` | `String` | Persisted YouTube user variable for join date (`"MM/YYYY"`) |
| **Stat Row 3 (Loyalty)** | `loyaltyLevel` | `String` | Persisted YouTube user variable for channel loyalty rank |

### C# Broadcast Action Code
Paste the following code into your Streamer.bot **Execute C# Code** sub-action:

```csharp
using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        // Retrieve YouTube User Details from Trigger Arguments
        string userId = args.ContainsKey("userId") ? args["userId"].ToString() : "";
        string userName = args.ContainsKey("user") ? args["user"].ToString() : "YouTube Member";
        string avatarUrl = args.ContainsKey("userProfileUrl") ? args["userProfileUrl"].ToString() : "";

        // Fetch Persisted YouTube User Variables
        string levelName = CPH.GetYouTubeUserVarById<string>(userId, "levelName", true) ?? "Member";
        int months = CPH.GetYouTubeUserVarById<int>(userId, "months", true);
        string memberSince = CPH.GetYouTubeUserVarById<string>(userId, "memberSince", true) ?? DateTime.Now.ToString("MM/yyyy");
        string loyaltyLevel = CPH.GetYouTubeUserVarById<string>(userId, "loyaltyLevel", true) ?? "Level 1";

        // Build Payload matching js/overlays.js expectations
        var payload = new
        {
            @event = "MemberWalkOn",
            userName = userName,
            avatarUrl = avatarUrl,
            levelName = levelName,
            months = months,
            memberSince = memberSince,
            loyaltyLevel = loyaltyLevel
        };

        // Broadcast to OBS Overlay via WebSocket
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        return true;
    }
}
```

---

## 🔗 URL Parameters Reference

If you prefer to edit your OBS Browser Source URL manually, `walkon-vi-card.html` accepts the following query parameters:

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `host` | `127.0.0.1` | Streamer.bot WebSocket IP address |
| `port` | `8080` | Streamer.bot WebSocket Port |
| `event` | `MemberWalkOn` | Custom WebSocket broadcast event name |
| `x` | `60` | Horizontal distance from the left edge (in pixels) |
| `y` | `60` | Vertical distance from the bottom edge (in pixels) |
| `scale` | `1` | Card scale multiplier (`0.5` to `2.0`) |
| `duration` | `8` | Time the card remains visible on screen (in seconds) |
| `cardAnim` | `anim-slide-left` | Card transition (`anim-slide-left`, `anim-slide-right`, `anim-slide-up`, `anim-zoom`) |
| `avatarAnim` | `av-flip` | Avatar animation (`av-flip`, `av-spin`, `av-pop`) |
| `fontHeading` | `Bebas Neue` | Google Font for the username (`Bebas Neue`, `Anton`, `Changa One`) |
| `fontBody` | `Inter` | Google Font for stats and badges (`Inter`, `Montserrat`, `Outfit`) |
| `bg` | `assets/gta6-bg.webp` | Relative path or external URL for the card background image |
| `lbl1` / `lbl2` / `lbl3` | `Tenure` / `Joined` / `Loyalty` | Custom display labels for the 3 stat rows |
| `vAvatar` / `vTier` | `avatarUrl` / `levelName` | Custom Streamer.bot variable keys for Avatar and Tier |
| `vMonths` / `vSince` / `vLoyalty` | `months` / `memberSince` / `loyaltyLevel` | Custom Streamer.bot variable keys for the 3 stat rows |

---

## 🛠️ Adding Future Overlays

Because all colors, HUD icon styles, and WebSocket utilities live in `css/overlays.css` and `js/overlays.js`, adding new overlays (such as **Sub/SuperChat Alerts**, **Goal Bars**, or **Chat Widgets**) only requires:
1. Creating a new HTML file that links `css/overlays.css` and `js/overlays.js`.
2. Reusing `GTAOverlayConfig` in `js/overlays.js` to read URL parameters and subscribe to Streamer.bot WebSocket events.