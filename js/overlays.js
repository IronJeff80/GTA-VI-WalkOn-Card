/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   ========================================================================== */

const DEFAULT_STAT_ROWS = [
  { label: 'Tenure',  varName: 'months',       suffix: ' Months', icon: 'fa-heart',          iconColor: 'pink',   valColor: 'yellow', fallback: '12' },
  { label: 'Joined',  varName: 'memberSince',  suffix: '',        icon: 'fa-calendar-check', iconColor: 'teal',   valColor: 'pink',   fallback: '05/2025' },
  { label: 'Loyalty', varName: 'loyaltyLevel', suffix: '',        icon: 'fa-eye',            iconColor: 'purple', valColor: 'teal',   fallback: 'Level 5' }
];

const GTAOverlayConfig = (() => {
  const params = new URLSearchParams(window.location.search);

  let parsedStats = DEFAULT_STAT_ROWS;
  if (params.has('stats')) {
    try {
      parsedStats = JSON.parse(params.get('stats'));
    } catch (e) {
      console.warn('[GTA-Overlay] Invalid stats JSON in URL, using defaults.');
    }
  }

  return {
    previewMode: params.get('preview') === '1',
    host: params.get('host') || '127.0.0.1',
    port: parseInt(params.get('port') || '8080', 10),
    endpoint: params.get('endpoint') || '/',
    password: params.get('password') || '',
    eventName: params.get('event') || 'MemberWalkOn',

    posX: params.get('x') || '60',
    posY: params.get('y') || '60',
    scale: params.get('scale') || '1',
    duration: parseInt(params.get('duration') || '8', 10) * 1000,
    cardAnim: params.get('cardAnim') || 'anim-slide-left',
    avatarAnim: params.get('avatarAnim') || 'av-flip',
    fontHeading: params.get('fontHeading') || 'Bebas Neue',
    fontBody: params.get('fontBody') || 'Inter',
    bgUrl: params.get('bg') || 'assets/gta6-bg.webp',

    colors: {
      pink:       params.get('cPink')   || '#f4acc4',
      teal:       params.get('cTeal')   || '#53d8bf',
      purple:     params.get('cPurple') || '#a688ff',
      yellow:     params.get('cYellow') || '#fede9a',
      iconStroke: params.get('cStroke') || '#171a21',
      border:     params.get('cBorder') || '#0b2328',
      bgFill:     params.get('cBg')     || '#303030'
    },

    varAvatar: params.get('vAvatar') || 'avatarUrl',
    varTier:   params.get('vTier')   || 'levelName',
    stats:     Array.isArray(parsedStats) ? parsedStats : DEFAULT_STAT_ROWS
  };
})();

class GTAWalkOnOverlay {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isAnimating = false;
    this.queue = [];
    this.lastData = {};

    this.dom = {
      container:  document.getElementById('walkon-container'),
      avatarWrap: document.getElementById('avatar-wrapper'),
      avatar:     document.getElementById('card-avatar'),
      username:   document.getElementById('card-username'),
      tier:       document.getElementById('card-tier'),
      metaBox:    document.getElementById('meta-box')
    };

    this.applyConfiguration();
    this.renderStatRows({});

    if (this.config.previewMode) {
      this.setPreviewPinned(true);
    }

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

    root.style.setProperty('--gta-pink', this.config.colors.pink);
    root.style.setProperty('--gta-teal', this.config.colors.teal);
    root.style.setProperty('--gta-purple', this.config.colors.purple);
    root.style.setProperty('--gta-yellow', this.config.colors.yellow);
    root.style.setProperty('--gta-icon-stroke', this.config.colors.iconStroke);
    root.style.setProperty('--gta-border', this.config.colors.border);
    root.style.setProperty('--gta-bg-fill', this.config.colors.bgFill);

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
  }

  setPreviewPinned(pinned) {
    this.config.previewMode = pinned;
    if (this.isAnimating) return;

    if (pinned) {
      this.dom.container.classList.remove('animate-out');
      this.dom.container.classList.add('animate-in');
    } else {
      this.dom.container.classList.remove('animate-in');
      this.dom.container.classList.add('animate-out');
    }
  }

  renderStatRows(data = {}) {
    if (!this.dom.metaBox) return;
    this.dom.metaBox.innerHTML = '';

    if (!this.config.stats || this.config.stats.length === 0) {
      this.dom.metaBox.classList.add('empty-stats');
      return;
    }

    this.dom.metaBox.classList.remove('empty-stats');

    this.config.stats.forEach((stat, index) => {
      const row = document.createElement('div');
      row.className = 'meta-row';
      row.style.setProperty('--row-delay', `${(0.35 + index * 0.12).toFixed(2)}s`);

      const rawVal = data[stat.varName] !== undefined && data[stat.varName] !== null
        ? data[stat.varName]
        : (stat.fallback || '--');
      const displayVal = `${rawVal}${stat.suffix || ''}`;

      row.innerHTML = `
        <span class="meta-label">
          <span class="hud-icon icon-${stat.iconColor || 'pink'}">
            <i class="fa-solid ${stat.icon || 'fa-star'}"></i>
          </span>
          <span>${stat.label}:</span>
        </span>
        <span class="meta-val val-${stat.valColor || 'yellow'}">${displayVal}</span>
      `;

      this.dom.metaBox.appendChild(row);
    });
  }

initWebSocket() {
    if (typeof StreamerbotClient === 'undefined') return;

    const clientOptions = {
      host: this.config.host,
      port: this.config.port,
      endpoint: this.config.endpoint,
      subscribe: {
        General: ['Custom']
      },
      onConnect: () => {
        console.log(`[GTA-Overlay] Connected to Streamer.bot (${this.config.host}:${this.config.port})`);
      },
      onDisconnect: () => {
        console.warn('[GTA-Overlay] Disconnected from Streamer.bot.');
      }
    };

    if (this.config.password) {
      clientOptions.password = this.config.password;
    }

    this.client = new StreamerbotClient(clientOptions);

    this.client.on('General.Custom', (payload) => {
      let data = payload.data || payload;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }

      if (data && (data.event === this.config.eventName || data.type === this.config.eventName)) {
        this.enqueueWalkOn(data);
      }
    });
  }

  initPostMessageBridge() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'TRIGGER_WALKON_TEST') {
        this.enqueueWalkOn(msg.payload || {});
      } else if (msg.type === 'SET_PREVIEW_PINNED') {
        this.setPreviewPinned(Boolean(msg.pinned));
      } else if (msg.type === 'LIVE_CONFIG_UPDATE') {
        const s = msg.state;
        this.config.posX = s.x;
        this.config.posY = s.y;
        this.config.scale = s.scale;
        this.config.duration = parseInt(s.duration || '8', 10) * 1000;
        this.config.cardAnim = s.cardAnim;
        this.config.avatarAnim = s.avatarAnim;
        this.config.fontHeading = s.fontHeading;
        this.config.fontBody = s.fontBody;
        this.config.bgUrl = s.bg;
        this.config.varAvatar = s.vAvatar;
        this.config.varTier = s.vTier;
        this.config.colors = {
          pink: s.cPink,
          teal: s.cTeal,
          purple: s.cPurple,
          yellow: s.cYellow,
          iconStroke: s.cStroke,
          border: s.cBorder,
          bgFill: s.cBg
        };
        try {
          this.config.stats = JSON.parse(s.stats);
        } catch (e) {}

        this.applyConfiguration();
        this.renderStatRows(this.lastData);
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
      if (this.config.previewMode) {
        await this.wait(250);
        this.dom.container.classList.remove('animate-out');
        this.dom.container.classList.add('animate-in');
      }
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

  async playWalkOn(raw) {
    this.lastData = raw;

    if (this.dom.container.classList.contains('animate-in')) {
      this.dom.container.classList.remove('animate-in');
      this.dom.container.classList.add('animate-out');
      await this.wait(450);
    }

    const userName = raw.userName || raw.user || 'ViceCityLegend';
    const avatarUrl = raw[this.config.varAvatar] || raw.avatarUrl || 'https://www.gstatic.com/youtube/img/creator/avatar/default_64.png';
    const levelName = raw[this.config.varTier] || raw.levelName || 'VIP Member';

    this.dom.avatar.src = avatarUrl;
    this.dom.username.textContent = userName;
    this.dom.tier.textContent = String(levelName).toUpperCase();

    this.renderStatRows(raw);

    this.dom.container.classList.remove('animate-out', 'animate-in');
    void this.dom.container.offsetWidth;
    this.dom.container.classList.add('animate-in');

    await this.wait(this.config.duration);

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