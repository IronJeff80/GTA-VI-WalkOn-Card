/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   ========================================================================== */

const GTAOverlayConfig = (() => {
  const params = new URLSearchParams(window.location.search);

  return {
    // Streamer.bot WebSocket Config
    host: params.get('host') || '127.0.0.1',
    port: parseInt(params.get('port') || '8080', 10),
    endpoint: params.get('endpoint') || '/',
    eventName: params.get('event') || 'MemberWalkOn',

    // Layout & Visuals
    posX: params.get('x') || '60',
    posY: params.get('y') || '60',
    scale: params.get('scale') || '1',
    duration: parseInt(params.get('duration') || '8', 10) * 1000,
    cardAnim: params.get('cardAnim') || 'anim-slide-left',
    avatarAnim: params.get('avatarAnim') || 'av-flip',
    fontHeading: params.get('fontHeading') || 'Bebas Neue',
    fontBody: params.get('fontBody') || 'Inter',
    bgUrl: params.get('bg') || 'assets/gta6-bg.webp',

    // Custom Labels
    labelRow1: params.get('lbl1') || 'Tenure',
    labelRow2: params.get('lbl2') || 'Joined',
    labelRow3: params.get('lbl3') || 'Loyalty',

    // Streamer.bot YouTube User Variable Names
    varAvatar: params.get('vAvatar') || 'avatarUrl',
    varTier: params.get('vTier') || 'levelName',
    varMonths: params.get('vMonths') || 'months',
    varSince: params.get('vSince') || 'memberSince',
    varLoyalty: params.get('vLoyalty') || 'loyaltyLevel'
  };
})();

class GTAWalkOnOverlay {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isAnimating = false;
    this.queue = [];

    this.dom = {
      container: document.getElementById('walkon-container'),
      avatarWrap: document.getElementById('avatar-wrapper'),
      avatar: document.getElementById('card-avatar'),
      username: document.getElementById('card-username'),
      tier: document.getElementById('card-tier'),
      lbl1: document.getElementById('label-row-1'),
      lbl2: document.getElementById('label-row-2'),
      lbl3: document.getElementById('label-row-3'),
      months: document.getElementById('card-months'),
      since: document.getElementById('card-since'),
      loyalty: document.getElementById('card-loyalty')
    };

    this.applyConfiguration();
    this.initWebSocket();
    this.initPostMessageBridge();
  }

  applyConfiguration() {
    const root = document.documentElement;
    root.style.setProperty('--card-x', `${this.config.posX}px`);
    root.style.setProperty('--card-y', `${this.config.posY}px`);
    root.style.setProperty('--card-scale', this.config.scale);
    root.style.setProperty('--font-heading', `'${this.config.fontHeading}', sans-serif`);
    root.style.setProperty('--font-body', `'${this.config.fontBody}', sans-serif`);

    if (this.config.bgUrl) {
      root.style.setProperty('--card-bg-image', `url('${this.config.bgUrl}')`);
    }

    if (this.dom.container) {
      this.dom.container.classList.remove('anim-slide-left', 'anim-slide-right', 'anim-slide-up', 'anim-zoom');
      this.dom.container.classList.add(this.config.cardAnim);
    }

    if (this.dom.avatarWrap) {
      this.dom.avatarWrap.classList.remove('av-flip', 'av-spin', 'av-pop');
      this.dom.avatarWrap.classList.add(this.config.avatarAnim);
    }

    if (this.dom.lbl1) this.dom.lbl1.textContent = `${this.config.labelRow1}:`;
    if (this.dom.lbl2) this.dom.lbl2.textContent = `${this.config.labelRow2}:`;
    if (this.dom.lbl3) this.dom.lbl3.textContent = `${this.config.labelRow3}:`;
  }

  initWebSocket() {
    if (typeof StreamerbotClient === 'undefined') {
      console.error('[GTA-Overlay] StreamerbotClient library not loaded.');
      return;
    }

    this.client = new StreamerbotClient({
      host: this.config.host,
      port: this.config.port,
      endpoint: this.config.endpoint,
      subscribe: {
        General: ['Custom']
      },
      onConnect: () => {
        console.log(`[GTA-Overlay] Connected to Streamer.bot (${this.config.host}:${this.config.port})`);
        window.parent.postMessage({ type: 'SB_STATUS', connected: true }, '*');
      },
      onDisconnect: () => {
        console.warn('[GTA-Overlay] Disconnected from Streamer.bot.');
        window.parent.postMessage({ type: 'SB_STATUS', connected: false }, '*');
      }
    });

    this.client.on('General.Custom', (payload) => {
      let data = payload.data || payload;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }

      if (data && (data.event === this.config.eventName || data.type === this.config.eventName)) {
        this.enqueueWalkOn(this.normalizePayload(data));
      }
    });
  }

  // Maps dynamic Streamer.bot variable names or standard payload properties
  normalizePayload(raw) {
    return {
      userName: raw.userName || raw.user || 'ViceCityLegend',
      avatarUrl: raw[this.config.varAvatar] || raw.avatarUrl || 'https://www.gstatic.com/youtube/img/creator/avatar/default_64.png',
      levelName: raw[this.config.varTier] || raw.levelName || 'VIP Member',
      months: raw[this.config.varMonths] !== undefined ? raw[this.config.varMonths] : (raw.months || 1),
      memberSince: raw[this.config.varSince] || raw.memberSince || '10/2026',
      loyaltyLevel: raw[this.config.varLoyalty] || raw.loyaltyLevel || 'Level 1'
    };
  }

  // Allows setup.html iframe preview to trigger instant tests without reloading
  initPostMessageBridge() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'TRIGGER_WALKON_TEST') {
        this.enqueueWalkOn(this.normalizePayload(msg.payload));
      }
    });
  }

  enqueueWalkOn(data) {
    this.queue.push(data);
    if (!this.isAnimating) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    const current = this.queue.shift();
    await this.playWalkOn(current);
    this.processQueue();
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async playWalkOn(data) {
    // Populate DOM
    this.dom.avatar.src = data.avatarUrl;
    this.dom.username.textContent = data.userName;
    this.dom.tier.textContent = String(data.levelName).toUpperCase();
    this.dom.months.textContent = `${data.months} Months`;
    this.dom.since.textContent = data.memberSince;
    this.dom.loyalty.textContent = String(data.loyaltyLevel).toLowerCase().includes('level')
      ? data.loyaltyLevel
      : `Level ${data.loyaltyLevel}`;

    // Reset & Trigger Entrance
    this.dom.container.classList.remove('animate-out', 'animate-in');
    void this.dom.container.offsetWidth; // Force reflow so keyframe animations replay cleanly
    this.dom.container.classList.add('animate-in');

    await this.wait(this.config.duration);

    // Trigger Exit
    this.dom.container.classList.remove('animate-in');
    this.dom.container.classList.add('animate-out');

    await this.wait(650);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('walkon-container')) {
    window.gtaWalkOn = new GTAWalkOnOverlay(GTAOverlayConfig);
  }
});