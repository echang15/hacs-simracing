import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class SimHubLapTrackerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _recentLaps: { type: Array },
      _lastRecentTimestamp: { type: String }
    };
  }

  constructor() {
    super();
    this._recentLaps = [];
    this._lastRecentTimestamp = null;
  }

  setConfig(config) {
    if (!config.best_lap_entity) {
      throw new Error("Please define best_lap_entity (e.g. sensor.simhub_best_lap)");
    }
    if (!config.recent_lap_entity) {
      throw new Error("Please define recent_lap_entity (e.g. sensor.simhub_recent_lap)");
    }
    this.config = config;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      const recentEntityId = this.config.recent_lap_entity;
      const recentStateObj = this.hass.states[recentEntityId];

      if (recentStateObj && recentStateObj.attributes && recentStateObj.attributes.timestamp) {
        if (this._lastRecentTimestamp !== recentStateObj.attributes.timestamp) {
          // New recent lap detected
          this._lastRecentTimestamp = recentStateObj.attributes.timestamp;

          const newLap = {
            lap_time: recentStateObj.state,
            timestamp: recentStateObj.attributes.timestamp,
            driver: recentStateObj.attributes.driver || "Unknown Driver",
            car: recentStateObj.attributes.car || "Unknown Car",
            track: recentStateObj.attributes.track || "Unknown Track",
            layout: recentStateObj.attributes.layout || "Unknown Layout"
          };

          // Check if this lap already exists to prevent duplicate on startup
          const isDuplicate = this._recentLaps.some(lap => lap.timestamp === newLap.timestamp);

          if (!isDuplicate) {
            this._recentLaps = [newLap, ...this._recentLaps].slice(0, 3);
          }
        }
      }
    }
  }

  render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    const bestEntityId = this.config.best_lap_entity;
    const bestStateObj = this.hass.states[bestEntityId];

    if (!bestStateObj) {
      return html`
        <ha-card>
          <div class="not-found">
            Entity not found: ${bestEntityId}
          </div>
        </ha-card>
      `;
    }

    const attrs = bestStateObj.attributes;
    const bestLapTime = bestStateObj.state;

    const track = attrs.track || "Unknown Track";
    const layout = attrs.layout || "Default Layout";
    const driver = attrs.driver || "Unknown Driver";
    const car = attrs.car || "Unknown Car";

    const trackPaths = this._generateImagePaths('/local/simhub/tracks', track);
    const carPaths = this._generateImagePaths('/local/simhub/cars', car);

    return html`
      <ha-card>
        <div class="card-background"></div>
        <div class="card-content">
          
          <div class="top-row">
            <div class="driver-info">
              <span class="driver-label">DRIVER</span>
              <div class="driver-name">${driver}</div>
            </div>
            <div class="track-info">
              <img 
                class="track-image-bg" 
                src="${trackPaths[0]}" 
                data-paths="${trackPaths.slice(1).join(',')}"
                @error="${this._handleImageError}" 
                alt="${track}" />
              <div class="track-name">${track}</div>
              <div class="track-layout">${layout}</div>
            </div>
          </div>

          <div class="middle-row">
            <div class="best-lap-section">
              <div class="section-label">ALL-TIME BEST</div>
              <div class="best-lap-time">${bestLapTime}</div>
            </div>
            
            <div class="car-section">
              <img 
                class="car-image" 
                src="${carPaths[0]}" 
                data-paths="${carPaths.slice(1).join(',')}"
                @error="${this._handleImageError}" 
                alt="${car}" />
              <div class="car-name">${car.replace(/_/g, ' ').toUpperCase()}</div>
            </div>
          </div>

          <div class="recent-laps-section">
            <div class="section-label">RECENT LAPS</div>
            <div class="recent-laps-list">
              ${this._recentLaps.length === 0 ? html`<div class="no-recent">No recent laps recorded</div>` : ''}
              ${this._recentLaps.map((lap, index) => html`
                <div class="recent-lap-item" style="animation-delay: ${index * 0.1}s">
                  <div class="lap-driver-name">${lap.driver}</div>
                  <div class="lap-car-name">${lap.car.replace(/_/g, ' ').toUpperCase()}</div>
                  <div class="lap-time-recent">${lap.lap_time}</div>
                </div>
              `)}
            </div>
          </div>

        </div>
      </ha-card>
    `;
  }

  _generateImagePaths(basePath, name) {
    if (!name) return [];
    
    const formats = new Set();
    
    // 1. Original Case (Case-sensitive exact match)
    formats.add(name);
    
    // 2. Original with spaces to underscores
    formats.add(name.replace(/ /g, '_'));
    
    // 3. Original with underscores to spaces
    formats.add(name.replace(/_/g, ' '));
    
    // 4. CamelCase (PascalCase)
    const pascalCase = name.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+|_/g, '');
    if (pascalCase) formats.add(pascalCase);
    
    // 5. lowerCamelCase
    if (pascalCase) formats.add(pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1));
    
    // 6. Lowercase with underscores (original default)
    formats.add(name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, ''));
    
    // 7. Lowercase with spaces
    formats.add(name.toLowerCase().replace(/_/g, ' '));
    
    // 8. Lowercase with no spaces
    formats.add(name.toLowerCase().replace(/[^a-z0-9]/g, ''));

    return Array.from(formats).map(f => `${basePath}/${f}.png`);
  }

  _handleImageError(e) {
    const img = e.target;
    const pathsStr = img.getAttribute('data-paths');
    if (pathsStr) {
      const paths = pathsStr.split(',');
      const nextPath = paths.shift();
      img.src = nextPath;
      if (paths.length > 0) {
        img.setAttribute('data-paths', paths.join(','));
      } else {
        img.removeAttribute('data-paths');
      }
    } else {
      img.onerror = null;
      if (img.classList.contains('car-image')) {
        const fallbackSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>');
        img.src = 'data:image/svg+xml;utf8,' + fallbackSvg;
      } else if (img.classList.contains('track-image-bg')) {
        img.style.display = 'none';
      }
    }
  }

  getRelativeTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  static get styles() {
    return css`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Titillium+Web:ital,wght@0,400;0,600;0,700;1,700&display=swap');

      :host {
        --primary-bg: #0f111a;
        --glass-bg: rgba(25, 28, 41, 0.65);
        --glass-border: rgba(255, 255, 255, 0.08);
        --accent-neon: #00ffcc;
        --accent-secondary: #ff0055;
        --text-main: #ffffff;
        --text-muted: #8b949e;
        --font-f1: 'Titillium Web', sans-serif;
        --font-numbers: 'Outfit', sans-serif;
      }

      ha-card {
        background: var(--primary-bg);
        border-radius: 24px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        color: var(--text-main);
      }

      .card-background {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(135deg, rgba(0,255,204,0.15) 0%, rgba(255,0,85,0.05) 100%);
        pointer-events: none;
        z-index: 0;
      }

      .card-background::after {
        content: '';
        position: absolute;
        top: -50%; left: -50%; width: 200%; height: 200%;
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%);
        animation: rotate-glow 20s linear infinite;
      }

      @keyframes rotate-glow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .card-content {
        position: relative;
        z-index: 1;
        padding: 24px;
        background: var(--glass-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--glass-border);
        padding-bottom: 16px;
      }

      .driver-label, .section-label {
        font-family: var(--font-numbers);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 2px;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 4px;
        display: block;
      }

      .driver-name {
        font-family: var(--font-f1);
        font-style: italic;
        font-weight: 700;
        font-size: 1.8rem;
        color: var(--text-main);
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        line-height: 1.1;
      }

      .track-info {
        position: relative;
        text-align: right;
        min-width: 150px;
        min-height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding-right: 4px;
        border-radius: 8px;
        z-index: 1;
      }

      .track-image-bg {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 100px;
        height: auto;
        max-height: 100%;
        object-fit: contain;
        z-index: -1;
        opacity: 0.6;
        pointer-events: none;
      }

      .track-name {
        font-family: var(--font-f1);
        font-weight: 600;
        font-size: 1.2rem;
        color: var(--accent-neon);
        text-shadow: 0 2px 8px rgba(0,0,0,1);
      }

      .track-layout {
        font-family: var(--font-numbers);
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        text-shadow: 0 1px 4px rgba(0,0,0,1);
      }

      .middle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .best-lap-section {
        flex: 1;
      }

      .best-lap-time {
        font-family: var(--font-numbers);
        font-weight: 900;
        font-size: 3.5rem;
        color: var(--text-main);
        line-height: 1;
        letter-spacing: -2px;
        text-shadow: 0 0 20px rgba(0, 255, 204, 0.4), 0 0 40px rgba(0, 255, 204, 0.2);
        animation: pulse-glow 3s infinite alternate ease-in-out;
      }

      @keyframes pulse-glow {
        0% { text-shadow: 0 0 15px rgba(0, 255, 204, 0.3); }
        100% { text-shadow: 0 0 25px rgba(0, 255, 204, 0.6), 0 0 50px rgba(0, 255, 204, 0.3); }
      }

      .car-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .car-image {
        max-width: 140px;
        max-height: 75px;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 6px;
        filter: drop-shadow(0 10px 15px rgba(0,0,0,0.6));
        transition: transform 0.3s ease;
      }

      .car-image:hover {
        transform: scale(1.05) translateX(-5px);
      }

      .car-name {
        font-family: var(--font-numbers);
        font-size: 0.7rem;
        color: var(--text-muted);
        margin-top: 8px;
        letter-spacing: 1px;
      }

      .recent-laps-section {
        background: rgba(0,0,0,0.2);
        border-radius: 16px;
        padding: 16px;
        border: 1px solid rgba(255,255,255,0.03);
      }

      .recent-laps-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }

      .no-recent {
        font-family: var(--font-numbers);
        font-size: 0.9rem;
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        padding: 12px 0;
      }

      .recent-lap-item {
        display: flex;
        align-items: center;
        background: rgba(255,255,255,0.03);
        padding: 10px 16px;
        border-radius: 12px;
        transition: background 0.2s ease;
        animation: slide-in 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) backwards;
      }

      .recent-lap-item:hover {
        background: rgba(255,255,255,0.08);
      }

      @keyframes slide-in {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .lap-driver-name {
        font-family: var(--font-f1);
        font-weight: 700;
        font-style: italic;
        color: var(--text-main);
        width: 35%;
        font-size: 1.1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lap-car-name {
        font-family: var(--font-numbers);
        font-size: 0.75rem;
        color: var(--accent-secondary);
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 10px;
      }

      .lap-time-recent {
        font-family: var(--font-numbers);
        font-weight: 600;
        font-size: 1.2rem;
        color: var(--accent-neon);
        text-align: right;
      }

      .not-found {
        padding: 24px;
        color: #ff0055;
        text-align: center;
        font-family: var(--font-numbers);
        font-weight: 600;
      }
    `;
  }
}

customElements.define("simhub-lap-tracker-card", SimHubLapTrackerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "simhub-lap-tracker-card",
  name: "SimHub Lap Tracker",
  preview: true,
  description: "A premium broadcast-style card for tracking SimHub lap times"
});
