/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   ========================================================================== */

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
  '<rect width="120" height="120" fill="#171a21"/>' +
  '<circle cx="60" cy="44" r="22" fill="#f4acc4"/>' +
  '<path d="M22 108 C22 78, 98 78, 98 108 Z" fill="#53d8bf"/>' +
  '</svg>'
);

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

    posX: parseFloat(params.get('x') || '60'),
    posY: parseFloat(params.get('y') || '60'),
    scale: parseFloat(params.get('scale') || '1'),
    alignH: params.get('alignH') === '1',
    alignV: params.get('alignV') === '1',
    noBg: params.get('noBg') === '1',

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
      card:       document.querySelector('.walkon-card'),
      avatarWrap: document.getElementById('avatar-wrapper'),
      avatar:     document.getElementById('card-avatar'),
      username:   document.getElementById('card-username'),
      tier:       document.getElementById('card-tier'),
      metaBox:    document.getElementById('meta-box')
    };

    if (this.dom.avatar) {
      this.dom.avatar.onerror = () => {
        if (this.dom.avatar.src !== DEFAULT_AVATAR_SVG) {
          this.dom.avatar.src = DEFAULT_AVATAR_SVG;
        }
      };
    }

    this.renderStatRows({});
    this.applyConfiguration();

    if (this.config.previewMode) {
      document.body.classList.add('preview-interactive');
      this.initStudioInteractivity();
      this.setPreviewPinned(true);
    }

    this.initWebSocket();
    this.initPostMessageBridge();
  }

  resolveAssetUrl(rawPath) {
    if (!rawPath) return '';
    const trimmed = rawPath.trim();
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) {
      return trimmed;
    }
    try {
      return new URL(trimmed, window.location.href).href;
    } catch (e) {
      return trimmed;
    }
  }

  getField(obj, key, aliases = []) {
    if (!obj || typeof obj !== 'object') return undefined;
    const candidates = [key, ...aliases].filter(Boolean);

    for (const c of candidates) {
      if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') {
        return obj[c];
      }
    }

    const lowerMap = {};
    Object.keys(obj).forEach(k => {
      lowerMap[k.toLowerCase().replace(/[\s_-]/g, '')] = obj[k];
    });

    for (const c of candidates) {
      const normalized = String(c).toLowerCase().replace(/[\s_-]/g, '');
      if (lowerMap[normalized] !== undefined && lowerMap[normalized] !== null && lowerMap[normalized] !== '') {
        return lowerMap[normalized];
      }
    }

    return undefined;
  }

  // Dynamically calculates centered X/Y based on current unscaled card dimensions and current scale
  recalculateCenteredCoords() {
    if (!this.dom.container) return;
    const scale = parseFloat(this.config.scale) || 1;
    const baseW = this.dom.container.offsetWidth || 340;
    const baseH = this.dom.container.offsetHeight || 390;
    const scaledW = baseW * scale;
    const scaledH = baseH * scale;

    if (this.config.alignH) {
      this.config.posX = Math.round((1920 - scaledW) / 2);
    }
    if (this.config.alignV) {
      this.config.posY = Math.round((1080 - scaledH) / 2);
    }
  }

  applyConfiguration() {
    const root = document.documentElement;

    this.recalculateCenteredCoords();

    root.style.setProperty('--card-x', `${Math.round(this.config.posX)}px`);
    root.style.setProperty('--card-y', `${Math.round(this.config.posY)}px`);
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

    if (this.dom.card) {
      if (this.config.noBg || !this.config.bgUrl) {
        this.dom.card.classList.add('no-bg-image');
      } else {
        this.dom.card.classList.remove('no-bg-image');
        const resolvedBg = this.resolveAssetUrl(this.config.bgUrl);
        root.style.setProperty('--card-bg-image', `url("${resolvedBg}")`);
      }
    }

    if (this.dom.container) {
      this.dom.container.classList.remove('anim-slide-left', 'anim-slide-right', 'anim-slide-up', 'anim-zoom');
      this.dom.container.classList.add(this.config.cardAnim);
    }

    if (this.dom.avatarWrap) {
      this.dom.avatarWrap.classList.remove('av-flip', 'av-spin', 'av-pop');
      this.dom.avatarWrap.classList.add(this.config.avatarAnim);
    }

    // Notify parent Setup Hub if alignment auto-adjusted X/Y
    if (this.config.previewMode && window.parent !== window && (this.config.alignH || this.config.alignV)) {
      window.parent.postMessage({
        type: 'CARD_CENTER_SYNC',
        x: Math.round(this.config.posX),
        y: Math.round(this.config.posY),
        scale: this.config.scale
      }, '*');
    }
  }

  // Injects interactive Drag & Corner-Resize handles inside Studio Preview Mode
  initStudioInteractivity() {
    if (!this.dom.container) return;

    // 1. Snap Guide Lines on Canvas
    const guideV = document.createElement('div');
    guideV.className = 'snap-guide vertical';
    guideV.style.left = '960px';
    document.body.appendChild(guideV);

    const guideH = document.createElement('div');
    guideH.className = 'snap-guide horizontal';
    guideH.style.top = '540px';
    document.body.appendChild(guideH);

    // 2. Drag Header Pill
    const dragPill = document.createElement('div');
    dragPill.className = 'studio-drag-pill';
    dragPill.innerHTML = '<i class="fa-solid fa-up-down-left-right"></i> Drag to Move • Drag Corner to Scale';
    this.dom.container.appendChild(dragPill);

    // 3. Top-Right Corner Resize Handle (since transform-origin is bottom-left)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'studio-resize-handle';
    resizeHandle.title = 'Drag corner to scale card';
    this.dom.container.appendChild(resizeHandle);

    let isDragging = false;
    let isResizing = false;
    let startClientX = 0;
    let startClientY = 0;
    let startPosX = 0;
    let startPosY = 0;
    let startScale = 1;
    let baseW = 340;
    let baseH = 390;
    const SNAP_THRESHOLD = 14;

    // Drag Start
    this.dom.container.addEventListener('mousedown', (e) => {
      if (e.target === resizeHandle || !this.config.previewMode || this.isAnimating) return;
      e.preventDefault();
      isDragging = true;
      startClientX = e.clientX;
      startClientY = e.clientY;
      startPosX = parseFloat(this.config.posX) || 0;
      startPosY = parseFloat(this.config.posY) || 0;
      baseW = this.dom.container.offsetWidth || 340;
      baseH = this.dom.container.offsetHeight || 390;
      this.dom.container.classList.add('is-manipulating');
    });

    // Resize Start
    resizeHandle.addEventListener('mousedown', (e) => {
      if (!this.config.previewMode || this.isAnimating) return;
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      startClientX = e.clientX;
      startClientY = e.clientY;
      startScale = parseFloat(this.config.scale) || 1;
      baseW = this.dom.container.offsetWidth || 340;
      baseH = this.dom.container.offsetHeight || 390;
      this.dom.container.classList.add('is-manipulating');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging && !isResizing) return;

      // Inside the iframe, clientX/clientY are already in 1920x1080 CSS pixel space
      const dx = e.clientX - startClientX;
      const dy = e.clientY - startClientY;

      if (isDragging) {
        const scale = parseFloat(this.config.scale) || 1;
        const scaledW = baseW * scale;
        const scaledH = baseH * scale;

        let nextX = Math.round(Math.max(0, Math.min(1920 - scaledW, startPosX + dx)));
        // Since bottom is used for Y, moving mouse up (-dy) increases bottom Y
        let nextY = Math.round(Math.max(0, Math.min(1080 - scaledH, startPosY - dy)));

        guideV.style.display = 'none';
        guideH.style.display = 'none';

        // Magnetic Center Snapping (unless holding Alt)
        if (!e.altKey) {
          const centerX = Math.round((1920 - scaledW) / 2);
          const centerY = Math.round((1080 - scaledH) / 2);

          if (Math.abs(nextX - centerX) <= SNAP_THRESHOLD) {
            nextX = centerX;
            guideV.style.display = 'block';
          }
          if (Math.abs(nextY - centerY) <= SNAP_THRESHOLD) {
            nextY = centerY;
            guideH.style.display = 'block';
          }
        }

        // Manual drag releases automatic center lock toggles unless snapped to center
        this.config.alignH = false;
        this.config.alignV = false;
        this.config.posX = nextX;
        this.config.posY = nextY;

        document.documentElement.style.setProperty('--card-x', `${nextX}px`);
        document.documentElement.style.setProperty('--card-y', `${nextY}px`);

        window.parent.postMessage({
          type: 'CARD_MANIPULATED',
          x: nextX,
          y: nextY,
          scale: this.config.scale,
          alignH: false,
          alignV: false
        }, '*');
      } else if (isResizing) {
        const startScaledW = baseW * startScale;
        // Dragging right (+dx) or up (-dy) increases scale
        const delta = Math.max(dx, -dy);
        const rawScale = startScale * ((startScaledW + delta) / startScaledW);
        const newScale = Math.round(Math.max(0.5, Math.min(2.0, rawScale)) * 20) / 20;

        this.config.scale = newScale;
        this.recalculateCenteredCoords();

        document.documentElement.style.setProperty('--card-scale', newScale);
        document.documentElement.style.setProperty('--card-x', `${Math.round(this.config.posX)}px`);
        document.documentElement.style.setProperty('--card-y', `${Math.round(this.config.posY)}px`);

        window.parent.postMessage({
          type: 'CARD_MANIPULATED',
          x: Math.round(this.config.posX),
          y: Math.round(this.config.posY),
          scale: newScale,
          alignH: this.config.alignH,
          alignV: this.config.alignV
        }, '*');
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        isDragging = false;
        isResizing = false;
        guideV.style.display = 'none';
        guideH.style.display = 'none';
        this.dom.container.classList.remove('is-manipulating');
      }
    });
  }

  setPreviewPinned(pinned) {
    this.config.previewMode = pinned;
    if (this.isAnimating) return;

    if (pinned) {
      document.body.classList.add('preview-interactive');
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

      const matchedVal = this.getField(data, stat.varName);
      const rawVal = matchedVal !== undefined ? matchedVal : (stat.fallback || '--');
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
    if (this.config.previewMode && window.parent !== window) {
      console.log('[GTA-Overlay] Preview mode active: receiving events via Setup Hub bridge.');
      return;
    }

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
      let data = payload?.data ?? payload;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      if (data && data.data && typeof data.data === 'object' && !data.event) {
        data = data.data;
      } else if (data && typeof data.data === 'string') {
        try { data = JSON.parse(data.data); } catch (e) {}
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
        this.config.posX = parseFloat(s.x || '60');
        this.config.posY = parseFloat(s.y || '60');
        this.config.scale = parseFloat(s.scale || '1');
        this.config.alignH = s.alignH === '1';
        this.config.alignV = s.alignV === '1';
        this.config.noBg = s.noBg === '1';
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

        this.renderStatRows(this.lastData);
        this.applyConfiguration();
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

    const userName = this.getField(raw, 'userName', ['user', 'targetUser', 'displayName']) || 'ViceCityLegend';
    const avatarUrl = this.getField(raw, this.config.varAvatar, ['avatarUrl', 'userProfileUrl', 'avatar', 'profileImageUrl']) || DEFAULT_AVATAR_SVG;
    const levelName = this.getField(raw, this.config.varTier, ['levelName', 'tier', 'tierName', 'memberTier', 'role']) || 'VIP Member';

    this.dom.avatar.src = avatarUrl;
    this.dom.username.textContent = userName;
    this.dom.tier.textContent = String(levelName).toUpperCase();

    this.renderStatRows(raw);
    this.applyConfiguration();

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
