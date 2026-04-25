# 🏎️ SimHub Lap Tracker Card

A premium, highly-polished Home Assistant custom Lovelace card (HACS compatible) designed to display real-time sim racing lap records broadcasted via MQTT from SimHub. 

Built with LitElement, this card brings a sleek, broadcast-quality racing overlay straight to your Home Assistant dashboard.

## ✨ Features
- **Premium Aesthetics**: Utilizes deep dark themes, dynamic rotating neon gradients, and beautiful glassmorphism (`backdrop-filter`).
- **F1-Style Typography**: Automatically imports and uses *Titillium Web* for driver names and *Outfit* for crisp, high-tech telemetry numbers.
- **Dynamic Car Images**: Displays an image of the car you are currently driving. Elegantly falls back to a custom vector outline if the image isn't found.
- **Dynamic Track Maps**: Automatically maps your current circuit to a glowing, neon track map outline displayed in the background.
- **Recent Laps History**: Tracks your session in real-time, displaying a beautifully styled leaderboard of your 3 most recent laps (Driver | Car | Laptime).
- **Subtle Micro-Animations**: Includes a pulsating glow on your All-Time Best lap, sliding entry animations for new laps, and a 3D hover effect on the car.

---

## 📦 Installation

### Option 1: HACS (Recommended)
1. Open Home Assistant and navigate to **HACS** > **Frontend**.
2. Click the 3 dots in the top right corner and select **Custom repositories**.
3. Add the URL of this repository: `https://github.com/echang15/hacs-simracing`
4. Select **Dashboard** as the category and click Add.
5. Click on the new **SimHub Lap Tracker** repository and click **Download**.
6. When prompted, click **Reload** to refresh your browser cache.

### Option 2: Manual Installation
1. Download the `simhub-lap-tracker-card.js` file.
2. Copy it into your `config/www/` directory.
3. In Home Assistant, go to **Settings** > **Dashboards** > **Resources**.
4. Click **Add Resource**, set the URL to `/local/simhub-lap-tracker-card.js`, and the Resource Type to **JavaScript Module**.

---

## ⚙️ Configuration

Add the custom card to your Lovelace dashboard using the manual card editor:

```yaml
type: custom:simhub-lap-tracker-card
best_lap_entity: sensor.simhub_best_lap
recent_lap_entity: sensor.simhub_recent_lap
```

### Required Sensors
This card requires a custom SimHub plugin that publishes your lap times to MQTT, creating two auto-discovered sensors in Home Assistant. Both sensors must provide the following JSON attributes:
- `timestamp`: ISO-8601 date string
- `driver`: Name of the current driver (e.g., "Player 1")
- `car`: The ID/Name of the car (e.g., "porsche_911_gt3_r")
- `track`: The ID/Name of the track (e.g., "Brands Hatch")
- `layout`: The circuit layout (e.g., "GP")

---

## 🖼️ Setting up Custom Images

To get the most out of this card, you can add your own custom car images and track outlines. 

### Car Images
Place transparent `.png` images of your cars into your `config/www/simhub/cars/` directory. 
*The filename must exactly match the `car` attribute sent by your SimHub plugin.*
Example: `/config/www/simhub/cars/porsche_911_gt3.png`

> **Pro Tip:** Included in this repository is a Python script (`car_generator_agent.py`) that uses the OpenAI API to automatically generate 8-bit retro pixel art versions of your favorite cars!

### Track Backgrounds
Place transparent `.png` images of circuit maps into your `config/www/simhub/tracks/` directory.
*The card automatically converts the `track` attribute into a safe filename (lowercase, spaces replaced with underscores).*
Example: For a track named "Silverstone GP", place the image at `/config/www/simhub/tracks/silverstone_gp.png`.

---
*Built for the ultimate Sim Racing Smart Home integration.*
