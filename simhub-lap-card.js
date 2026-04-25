import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class SimHubLapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _pulse: { type: Boolean }
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity (e.g. sensor.simhub_best_lap)");
    }
    this.config = config;
    this._pulse = false;
    this._lastTimestamp = null;
  }

  updated(changedProperties) {
    if (changedProperties.has('hass')) {
      const entityId = this.config.entity;
      const stateObj = this.hass.states[entityId];

      if (stateObj && stateObj.attributes.timestamp) {
        if (this._lastTimestamp && this._lastTimestamp !== stateObj.attributes.timestamp) {
          // Trigger pulse animation when timestamp changes (i.e., new record)
          this._pulse = true;
          setTimeout(() => {
            this._pulse = false;
          }, 1500);
        }
        this._lastTimestamp = stateObj.attributes.timestamp;
      }
    }
  }

  getRelativeTime(timestamp) {
    if (!timestamp) return 'No record yet';
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  }

  render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    const stateObj = this.hass.states[this.config.entity];

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="not-found">
            Entity not found: ${this.config.entity}
          </div>
        </ha-card>
      `;
    }

    const attributes = stateObj.attributes;
    const lapTime = stateObj.state;
    // Fallbacks if attributes are missing
    const track = attributes.track || "Unknown Track";
    const car = attributes.car || "Unknown Car";
    const timestamp = attributes.timestamp;
    const relativeTime = this.getRelativeTime(timestamp);

    return html`
      <ha-card class="${this._pulse ? 'pulse' : ''}">
        <div class="card-content">
          <div class="header">
            <span class="track-name"><ha-icon icon="mdi:map-marker-path"></ha-icon> ${track}</span>
            <span class="relative-time">${relativeTime}</span>
          </div>
          
          <div class="lap-container">
            <div class="lap-label">BEST LAP</div>
            <div class="lap-time accent-glow">${lapTime}</div>
          </div>
          
          <div class="footer">
            <span class="car-name"><ha-icon icon="mdi:car-sports"></ha-icon> ${car}</span>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        /* Premium Dark Aesthetics */
        --primary-bg: #15161c;
        --secondary-bg: #1e1e26;
        --accent-neon: #00E5FF;
        --text-main: #ffffff;
        --text-muted: #8e95a1;
        --font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      ha-card {
        background: linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        color: var(--text-main);
        font-family: var(--font-family);
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        position: relative;
      }

      /* Inner glass glow effect */
      ha-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle at 50% 0%, rgba(0, 229, 255, 0.05) 0%, transparent 70%);
        pointer-events: none;
      }

      ha-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 229, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      .pulse {
        animation: pulse-border 1.5s ease-out;
      }

      @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.6); }
        70% { box-shadow: 0 0 0 20px rgba(0, 229, 255, 0), 0 10px 30px rgba(0, 0, 0, 0.6); }
        100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0), 0 10px 30px rgba(0, 0, 0, 0.6); }
      }

      .card-content {
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        position: relative;
        z-index: 1;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
        letter-spacing: 0.8px;
        text-transform: uppercase;
      }

      .header ha-icon {
        --mdc-icon-size: 16px;
        margin-right: 6px;
        color: var(--text-muted);
        opacity: 0.8;
      }

      .lap-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 0 24px 0;
      }

      .lap-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-muted);
        letter-spacing: 3px;
        margin-bottom: 8px;
        opacity: 0.7;
      }

      .lap-time {
        font-size: 4rem;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -1.5px;
        color: var(--text-main);
      }

      .accent-glow {
        color: var(--text-main);
        text-shadow: 0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.2);
        animation: subtle-glow 4s infinite alternate ease-in-out;
      }
      
      @keyframes subtle-glow {
        0% { text-shadow: 0 0 15px rgba(0, 229, 255, 0.4), 0 0 30px rgba(0, 229, 255, 0.1); }
        100% { text-shadow: 0 0 25px rgba(0, 229, 255, 0.6), 0 0 50px rgba(0, 229, 255, 0.3); }
      }

      .footer {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--accent-neon);
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .footer ha-icon {
        --mdc-icon-size: 22px;
        margin-right: 8px;
        color: var(--text-main);
      }

      .not-found {
        padding: 24px;
        color: #ff5252;
        text-align: center;
        font-weight: 500;
      }
    `;
  }
}

// Make sure to define the custom element
customElements.define("simhub-lap-card", SimHubLapCard);
// Optional: Register the card in Home Assistant's custom element card selector UI
window.customCards = window.customCards || [];
window.customCards.push({
  type: "simhub-lap-card",
  name: "SimHub Best Lap",
  preview: true, 
  description: "A premium card to display your best SimHub lap records"
});
