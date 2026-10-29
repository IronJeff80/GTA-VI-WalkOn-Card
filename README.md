# 🌴 GTA VI OBS Overlays & Graphics Suite

A modular, customizable OBS Studio Browser Source overlay suite inspired by the official **Grand Theft Auto VI** HUD and Vice City / Leonida aesthetics. Powered by **Streamer.bot WebSockets** and built specifically for **YouTube Live** creators.

🔗 **Live Setup & Testing Hub:** [https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html](https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html)

---

## ✨ Features

* **Authentic GTA VI Palette & HUD Styling:** Extracted directly from official GTA VI gameplay and promotional art, with full color-picker overrides and 1-click default resets.
* **Shared Modular Architecture:** Single master stylesheet (`css/overlays.css`) and core JavaScript engine (`js/overlays.js`) designed to power multiple overlays without duplicating code.
* **Universal 4-Tab Setup & Live Testing Hub (`setup.html`):**
  * **General Tab:** Configure Streamer.bot IP, Port, optional **WebSocket Password**, custom event name, card coordinates (`X`/`Y`), scale, display duration, entrance transitions, 3D avatar animations (`3D Coin Flip`, `360° Spin`, `Elastic Pop`), fonts, and background image URL.
  * **Variables Tab (Dynamic Stat Builder):** Add, remove, and customize any number of stat rows. Configure each row's Label, Streamer.bot Variable Name, optional Suffix (e.g., ` Months`, ` hrs`), HUD Icon, Icon Color, and Value Color.
  * **Colors Tab:** Customize all 7 core GTA VI palette tokens live with color pickers or hex codes, or reset to GTA VI defaults anytime.
  * **Test Tab:** Run instant random walk-on simulations or query **real persisted YouTube User Variables** directly from your Streamer.bot database.
* **Pin Card Visible (Setup Mode):** Keep the card locked on screen in the preview canvas while adjusting positions, fonts, and colors in real time—then automatically hide and play the full entrance/pop animation sequence when testing.

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

| Color Name | Default Hex | CSS Variable | URL Param | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Vice Pink** | `#f4acc4` | `--gta-pink` | `cPink` | Avatar outlines, primary accents, HUD heart icon |
| **Leonida Teal** | `#53d8bf` | `--gta-teal` | `cTeal` | Top card border, left meta accent, HUD lungs/calendar icon |
| **Sunset Purple** | `#a688ff` | `--gta-purple` | `cPurple` | Tier badges, HUD focus icon, secondary glows |
| **Solar Yellow** | `#fede9a` | `--gta-yellow` | `cYellow` | Username typography, primary stat highlights |
| **Icon Stroke** | `#171a21` | `--gta-icon-stroke` | `cStroke` | Heavy text strokes, inner card framing |
| **Border / Stroke** | `#0b2328` | `--gta-border` | `cBorder` | Outer card borders, HUD icon rings |
| **BG / Alpha Fill** | `#303030` | `--gta-bg-fill` | `cBg` | Base card fill and dark translucent stat containers |

---

## 🚀 Quick Start Guide

### 1. Enable Streamer.bot WebSocket Server
1. Open **Streamer.bot**.
2. Navigate to **Servers/Clients** > **WebSocket Server**.
3. Check **Auto Start WebSocket Server** and click **Start Server**.
4. Note your **Address** (default: `127.0.0.1`), **Port** (default: `8080`), and **Password** (if Authentication is enabled).

### 2. Configure Your Overlay (`setup.html`)
1. Open `setup.html` in your browser.
2. In the **General** tab, enter your Streamer.bot **WebSocket IP**, **Port**, and optional **Password**, then click **Connect SB**.
3. Keep **"Pin Card Visible (Setup Mode)"** checked above the preview canvas so you can see the card live while adjusting X/Y offsets, scale, fonts, variables, and colors across the **General**, **Variables**, and **Colors** tabs.
4. Click **Quick Test Animation** (or open the **Test** tab) to watch the card hide and play the full entrance animation, avatar flip/spin, and staggered stat pop sequence.
5. Click **Copy URL** at the top of the workspace to copy your personalized OBS Browser Source link (note: the copied URL automatically omits `preview=1` so the card stays hidden in OBS until triggered).

> **💡 Browser Note for GitHub Pages (`https://`):** If your browser blocks connecting from an `https://` GitHub Pages URL to a local `ws://127.0.0.1` WebSocket, click the Tune/Lock icon next to your browser's address bar > **Site settings** > set **Insecure content** to **Allow** (or lower Brave Shields for the site).

### 3. Add to OBS Studio
1. In OBS Studio, add a new **Browser Source** to your scene.
2. Paste the copied URL into the **URL** field.
3. Set **Width** to `1920` and **Height** to `1080`.
4. Click **OK**.

---

## 🤖 Streamer.bot YouTube Setup

### 1. Live Walk-On Trigger Action
To trigger the Walk-On overlay when a YouTube member chats or joins, create an Action in Streamer.bot (e.g., `YouTube - Member Walk-On`) and add an **Execute C# Code** sub-action:

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

        // Fetch Persisted YouTube User Variables (Add any custom variables you configured in setup.html)
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

### 2. Specific User Lookup Action for `setup.html` Testing (`GTA_LookupYouTubeUser`)
To allow the **Test** tab in `setup.html` to pull real persisted YouTube User Variables for any specific user on demand, create an Action in Streamer.bot named **`GTA_LookupYouTubeUser`** and add this **Execute C# Code** sub-action:

```csharp
using System;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string targetUser = args.ContainsKey("targetUser") ? args["targetUser"].ToString().Trim() : "";
        string requestedVarsCsv = args.ContainsKey("requestedVars") ? args["requestedVars"].ToString() : "avatarUrl,levelName,months,memberSince,loyaltyLevel";

        if (string.IsNullOrEmpty(targetUser))
            return false;

        var result = new Dictionary<string, object>();
        result["event"] = "GTA_UserLookupResult";
        result["targetUser"] = targetUser;
        result["userName"] = targetUser;

        string[] varNames = requestedVarsCsv.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

        foreach (string rawVar in varNames)
        {
            string varName = rawVar.Trim();

            // 1. Try lookup by YouTube Channel ID (e.g., UC...)
            object val = CPH.GetYouTubeUserVarById<object>(targetUser, varName, true);

            // 2. Fallback to lookup by YouTube Username
            if (val == null)
            {
                val = CPH.GetYouTubeUserVar<object>(targetUser, varName, true);
            }

            if (val != null)
            {
                result[varName] = val;
            }
        }

        string storedName = CPH.GetYouTubeUserVarById<string>(targetUser, "userName", true) 
                         ?? CPH.GetYouTubeUserVar<string>(targetUser, "userName", true);
        if (!string.IsNullOrEmpty(storedName))
        {
            result["userName"] = storedName;
        }

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(result));
        return true;
    }
}
```

---

## 🔗 URL Parameters Reference

`walkon-vi-card.html` accepts the following URL query parameters (automatically generated by `setup.html`):

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `host` | `127.0.0.1` | Streamer.bot WebSocket IP address |
| `port` | `8080` | Streamer.bot WebSocket Port |
| `password` | *(empty)* | Optional Streamer.bot WebSocket authentication password |
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
| `vAvatar` / `vTier` | `avatarUrl` / `levelName` | Streamer.bot variable keys for Avatar URL and Tier badge |
| `stats` | *(JSON Array)* | JSON-encoded array of stat row objects (`label`, `varName`, `suffix`, `icon`, `iconColor`, `valColor`) |
| `cPink`, `cTeal`, `cPurple`, `cYellow` | `#f4acc4`, `#53d8bf`, `#a688ff`, `#fede9a` | Hex color overrides for primary GTA VI accent colors |
| `cStroke`, `cBorder`, `cBg` | `#171a21`, `#0b2328`, `#303030` | Hex color overrides for icon/text stroke, card border, and base fill |
| `preview` | `0` (`1` in Setup) | Pins the card visible on-screen for live layout positioning inside `setup.html` |

---

## 🛠️ Adding Future Overlays

Because all colors, HUD icon styles, and WebSocket utilities live in `css/overlays.css` and `js/overlays.js`, adding new overlays (such as **Sub/SuperChat Alerts**, **Goal Bars**, or **Chat Widgets**) only requires:
1. Creating a new HTML file that links `css/overlays.css` and `js/overlays.js`.
2. Reusing `GTAOverlayConfig` in `js/overlays.js` to read URL parameters and subscribe to Streamer.bot WebSocket events.