/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   v0.0.3 - Modules Update
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
    try { parsedStats = JSON.parse(params.get('stats')); } 
    catch (e) { console.warn('[GTA-Overlay] Invalid stats JSON in URL, using defaults.'); }
  }

  // Parse modules to enable (default: all)
  const modulesParam = params.get('modules') || 'all';
  const enableWalkon = modulesParam === 'all' || modulesParam.includes('walkon');
  const enableAlerts = modulesParam === 'all' || modulesParam.includes('alerts');

  return {
    previewMode: params.get('preview') === '1',
    modules: { walkon: enableWalkon, alerts: enableAlerts },

    host: params.get('host') || '127.0.0.1',
    port: parseInt(params.get('port') || '8080', 10),
    endpoint: params.get('endpoint') || '/',
    password: params.get('password') || '',
    
    // Walk-on Config
    walkonEvent: params.get('event') || 'MemberWalkOn',
    posX: parseFloat(params.get('x') || '60'),
    posY: parseFloat(params.get('y') || '60'),
    scale: parseFloat(params.get('scale') || '1'),
    alignH: params.get('alignH') === '1',
    alignV: params.get('alignV') === '1',
    duration: parseInt(params.get('duration') || '8', 10) * 1000,
    cardAnim: params.get('cardAnim') || 'anim-slide-left',
    avatarAnim: params.get('avatarAnim') || 'av-flip',

    // Alerts Config
    alertEvent: params.get('alertEvent') || 'GTA_Alert',
    alertX: parseFloat(params.get('ax') || '960'), // Center X by default
    alertY: parseFloat(params.get('ay') || '100'), // Top Y by default
    alertScale: parseFloat(params.get('ascale') || '1'),
    alertAlignH: params.get('aAlignH') !== '0', // Default true
    alertAlignV: params.get('aAlignV') === '1',
    alertDuration: parseInt(params.get('aDur') || '6', 10) * 1000,
    alertsConfig: {
      sub: params.get('al_sub') !== '0',
      member: params.get('al_mem') !== '0',
      milestone: params.get('al_ms') !== '0',
      gift: params.get('al_gft') !== '0',
      giftRec: params.get('al_grc') !== '0',
      superchat: params.get('al_sc') !== '0',
      supersticker: params.get('al_stk') !== '0',
      jewels: params.get('al_jwl') !== '0',
    },

    fontHeading: params.get('fontHeading') || 'Bebas Neue',
    fontBody: params.get('fontBody') || 'Inter',
    bgUrl: params.get('bg') || 'assets/gta6-bg.webp',
    noBg: params.get('noBg') === '1',

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

class GTAOverlayEngine {
  constructor(config) {
    this.config = config;
    this.client = null;
    
    this.walkonQueue = [];
    this.isWalkonAnimating = false;
    
    this.alertQueue = [];
    this.isAlertAnimating = false;
    
    this.lastWalkonData = {};

    this.dom = {
      walkonContainer: document.getElementById('walkon-container'),
      walkonCard:      document.querySelector('.walkon-card'),
      alertContainer:  document.getElementById('alert-container'),
      alertBox:        document.getElementById('alert-box')
    };

    // Ensure modules are visible/hidden based on URL
    if (this.dom.walkonContainer && !this.config.modules.walkon) this.dom.walkonContainer.style.display = 'none';
    if (this.dom.alertContainer && !this.config.modules.alerts) this.dom.alertContainer.style.display = 'none';

    this.applyGlobalStyles();
    
    if (this.config.modules.walkon) {
      this.recalculateWalkonCoords();
      this.renderStatRows({});
    }

    if (this.config.modules.alerts) {
      this.recalculateAlertCoords();
    }

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
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) return trimmed;
    try { return new URL(trimmed, window.location.href).href; } 
    catch (e) { return trimmed; }
  }

  getField(obj, key, aliases = []) {
    if (!obj || typeof obj !== 'object') return undefined;
    const candidates = [key, ...aliases].filter(Boolean);
    for (const c of candidates) {
      if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return obj[c];
    }
    const lowerMap = {};
    Object.keys(obj).forEach(k => { lowerMap[k.toLowerCase().replace(/[\s_-]/g, '')] = obj[k]; });
    for (const c of candidates) {
      const normalized = String(c).toLowerCase().replace(/[\s_-]/g, '');
      if (lowerMap[normalized] !== undefined && lowerMap[normalized] !== null && lowerMap[normalized] !== '') return lowerMap[normalized];
    }
    return undefined;
  }

  // =====================================
  // STYLES & COORDINATES
  // =====================================
  applyGlobalStyles() {
    const root = document.documentElement;
    root.style.setProperty('--font-heading', `'${this.config.fontHeading}', sans-serif`);
    root.style.setProperty('--font-body', `'${this.config.fontBody}', sans-serif`);
    root.style.setProperty('--gta-pink', this.config.colors.pink);
    root.style.setProperty('--gta-teal', this.config.colors.teal);
    root.style.setProperty('--gta-purple', this.config.colors.purple);
    root.style.setProperty('--gta-yellow', this.config.colors.yellow);
    root.style.setProperty('--gta-icon-stroke', this.config.colors.iconStroke);
    root.style.setProperty('--gta-border', this.config.colors.border);
    root.style.setProperty('--gta-bg-fill', this.config.colors.bgFill);

    if (this.config.modules.walkon && this.dom.walkonCard) {
      if (this.config.noBg || !this.config.bgUrl) {
        this.dom.walkonCard.classList.add('no-bg-image');
      } else {
        this.dom.walkonCard.classList.remove('no-bg-image');
        root.style.setProperty('--card-bg-image', `url("${this.resolveAssetUrl(this.config.bgUrl)}")`);
      }
      if (this.dom.walkonContainer) {
        this.dom.walkonContainer.className = `walkon-container ${this.config.cardAnim}`;
      }
    }
    
    this.updateDomCoords();
  }

  recalculateWalkonCoords() {
    if (!this.dom.walkonContainer) return;
    const scale = this.config.scale || 1;
    const w = this.dom.walkonContainer.offsetWidth || 340;
    const h = this.dom.walkonContainer.offsetHeight || 390;
    if (this.config.alignH) this.config.posX = Math.round((1920 - (w * scale)) / 2);
    if (this.config.alignV) this.config.posY = Math.round((1080 - (h * scale)) / 2);
  }

  recalculateAlertCoords() {
    if (!this.dom.alertContainer) return;
    const scale = this.config.alertScale || 1;
    const w = this.dom.alertContainer.offsetWidth || 460;
    const h = this.dom.alertContainer.offsetHeight || 140;
    // Alert is transform-origin: top center, translated -50% X. 
    // So X represents the CENTER of the alert.
    if (this.config.alertAlignH) this.config.alertX = 960; // Center screen
    if (this.config.alertAlignV) this.config.alertY = Math.round((1080 - (h * scale)) / 2);
  }

  updateDomCoords() {
    const root = document.documentElement;
    if (this.config.modules.walkon) {
      root.style.setProperty('--card-scale', this.config.scale);
      root.style.setProperty('--card-x', `${Math.round(this.config.posX)}px`);
      root.style.setProperty('--card-y', `${Math.round(this.config.posY)}px`);
    }
    if (this.config.modules.alerts) {
      root.style.setProperty('--alert-scale', this.config.alertScale);
      root.style.setProperty('--alert-x', `${Math.round(this.config.alertX)}px`);
      root.style.setProperty('--alert-y', `${Math.round(this.config.alertY)}px`);
    }
  }

  setPreviewPinned(pinned) {
    this.config.previewMode = pinned;
    if (pinned) {
      document.body.classList.add('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating) this.dom.walkonContainer.classList.add('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating) this.dom.alertContainer.classList.add('animate-in');
    } else {
      document.body.classList.remove('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating) this.dom.walkonContainer.classList.remove('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating) this.dom.alertContainer.classList.remove('animate-in');
    }
  }

  // =====================================
  // STUDIO INTERACTIVITY (DRAG & RESIZE)
  // =====================================
  initStudioInteractivity() {
    // Shared guides
    const guideV = document.createElement('div'); guideV.className = 'snap-guide vertical'; guideV.style.left = '960px'; document.body.appendChild(guideV);
    const guideH = document.createElement('div'); guideH.className = 'snap-guide horizontal'; guideH.style.top = '540px'; document.body.appendChild(guideH);

    this.setupDraggable(this.dom.walkonContainer, 'walkon', guideV, guideH);
    this.setupDraggable(this.dom.alertContainer, 'alert', guideV, guideH);
  }

  setupDraggable(container, modType, guideV, guideH) {
    if (!container) return;

    const dragPill = document.createElement('div');
    dragPill.className = 'studio-drag-pill';
    dragPill.innerHTML = `<i class="fa-solid fa-up-down-left-right"></i> ${modType === 'walkon' ? 'Card' : 'Alert'}`;
    container.appendChild(dragPill);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'studio-resize-handle';
    container.appendChild(resizeHandle);

    let isDragging = false, isResizing = false;
    let startX = 0, startY = 0, startObjX = 0, startObjY = 0, startScale = 1;
    let baseW = 0, baseH = 0;
    const SNAP = 14;

    container.addEventListener('mousedown', (e) => {
      if (e.target === resizeHandle || !this.config.previewMode) return;
      if ((modType === 'walkon' && this.isWalkonAnimating) || (modType === 'alert' && this.isAlertAnimating)) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startObjX = modType === 'walkon' ? this.config.posX : this.config.alertX;
      startObjY = modType === 'walkon' ? this.config.posY : this.config.alertY;
      baseW = container.offsetWidth; baseH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    resizeHandle.addEventListener('mousedown', (e) => {
      if (!this.config.previewMode) return;
      e.stopPropagation(); e.preventDefault();
      isResizing = true;
      startX = e.clientX; startY = e.clientY;
      startScale = modType === 'walkon' ? this.config.scale : this.config.alertScale;
      baseW = container.offsetWidth; baseH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (isDragging) {
        const scale = modType === 'walkon' ? this.config.scale : this.config.alertScale;
        let nextX = 0, nextY = 0;

        if (modType === 'walkon') {
          nextX = Math.max(0, Math.min(1920 - (baseW * scale), startObjX + dx));
          nextY = Math.max(0, Math.min(1080 - (baseH * scale), startObjY - dy)); // Bottom origin
          if (!e.altKey) {
            const cx = (1920 - (baseW * scale)) / 2;
            const cy = (1080 - (baseH * scale)) / 2;
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.alignH = false; this.config.alignV = false;
          this.config.posX = nextX; this.config.posY = nextY;
        } else {
          // Alert (Top Center origin)
          nextX = Math.max((baseW * scale)/2, Math.min(1920 - (baseW * scale)/2, startObjX + dx));
          nextY = Math.max(0, Math.min(1080 - (baseH * scale), startObjY + dy)); // Top origin
          if (!e.altKey) {
            const cx = 960;
            const cy = (1080 - (baseH * scale)) / 2;
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.alertAlignH = false; this.config.alertAlignV = false;
          this.config.alertX = nextX; this.config.alertY = nextY;
        }

        this.updateDomCoords();
        this.broadcastManipulate(modType);

      } else if (isResizing) {
        const delta = Math.max(dx, (modType === 'walkon' ? -dy : dy));
        const rawScale = startScale * (((baseW * startScale) + delta) / (baseW * startScale));
        const newScale = Math.round(Math.max(0.5, Math.min(2.0, rawScale)) * 20) / 20;
        
        if (modType === 'walkon') {
          this.config.scale = newScale;
          this.recalculateWalkonCoords();
        } else {
          this.config.alertScale = newScale;
          this.recalculateAlertCoords();
        }
        this.updateDomCoords();
        this.broadcastManipulate(modType);
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false; isResizing = false;
      guideV.style.display = 'none'; guideH.style.display = 'none';
      container.classList.remove('is-manipulating');
    });
  }

  broadcastManipulate(modType) {
    if (window.parent === window) return;
    if (modType === 'walkon') {
      window.parent.postMessage({ type: 'CARD_MANIPULATED', x: this.config.posX, y: this.config.posY, scale: this.config.scale, alignH: this.config.alignH, alignV: this.config.alignV }, '*');
    } else {
      window.parent.postMessage({ type: 'ALERT_MANIPULATED', ax: this.config.alertX, ay: this.config.alertY, ascale: this.config.alertScale, aAlignH: this.config.alertAlignH, aAlignV: this.config.alertAlignV }, '*');
    }
  }

  // =====================================
  // WEBSOCKET & EVENTS
  // =====================================
  initWebSocket() {
    if (this.config.previewMode && window.parent !== window) return; // Managed by setup.html
    if (typeof StreamerbotClient === 'undefined') return;

    const opts = { host: this.config.host, port: this.config.port, endpoint: this.config.endpoint, subscribe: { General: ['Custom'], YouTube: ['*'] } };
    if (this.config.password) opts.password = this.config.password;

    this.client = new StreamerbotClient(opts);
    this.client.on('Connect', () => console.log('[GTA-Overlay] Connected to SB.'));
    
    // Listen for custom broadcast (WalkOn or Generic JSON Alerts)
    this.client.on('General.Custom', (payload) => {
      let data = payload?.data ?? payload;
      if (typeof data === 'string') try { data = JSON.parse(data); } catch(e){}
      if (data?.data && typeof data.data === 'object' && !data.event) data = data.data;
      else if (data?.data && typeof data.data === 'string') try { data = JSON.parse(data.data); } catch(e){}

      if (!data) return;
      if (data.event === this.config.walkonEvent || data.type === this.config.walkonEvent) {
        if (this.config.modules.walkon) this.enqueueWalkOn(data);
      } else if (data.event === this.config.alertEvent || data.type === this.config.alertEvent) {
        if (this.config.modules.alerts) this.enqueueAlert(data);
      }
    });

    // Native Streamer.bot YouTube Event Hooks
    if (this.config.modules.alerts) {
      this.client.on('YouTube.NewSubscriber', (p) => this.handleNativeAlert('sub', 'New Subscriber', p.data));
      this.client.on('YouTube.NewSponsor', (p) => this.handleNativeAlert('member', 'New Member', p.data));
      this.client.on('YouTube.MemberMilestone', (p) => this.handleNativeAlert('milestone', 'Milestone', p.data));
      this.client.on('YouTube.GiftMembership', (p) => this.handleNativeAlert('gift', 'Membership Gift', p.data));
      this.client.on('YouTube.GiftMembershipReceived', (p) => this.handleNativeAlert('giftRec', 'Gift Received', p.data));
      this.client.on('YouTube.SuperChat', (p) => this.handleNativeAlert('superchat', 'Super Chat', p.data));
      this.client.on('YouTube.SuperSticker', (p) => this.handleNativeAlert('supersticker', 'Super Sticker', p.data));
    }
  }

  handleNativeAlert(type, title, data) {
    if (!this.config.alertsConfig[type]) return; // Disabled in config
    const alertData = { alertType: type, triggerName: title };
    
    if (data.user) {
      alertData.userName = data.user.name || data.user.id;
      alertData.userProfileUrl = data.user.profileImageUrl;
    }
    
    if (type === 'member') alertData.levelName = data.tierName || 'Member';
    if (type === 'milestone') { alertData.levelName = data.tierName; alertData.months = data.months; alertData.message = data.message; }
    if (type === 'gift') alertData.count = data.count;
    if (type === 'giftRec') alertData.gifterUser = data.sender?.name;
    if (type === 'superchat') { alertData.amount = data.amount; alertData.message = data.message; }
    if (type === 'supersticker') { alertData.amount = data.amount; alertData.message = data.message; alertData.stickerImageUrl = data.stickerUrl; }

    this.enqueueAlert(alertData);
  }

  initPostMessageBridge() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'TRIGGER_WALKON_TEST') {
        if (this.config.modules.walkon) this.enqueueWalkOn(msg.payload || {});
      } else if (msg.type === 'TRIGGER_ALERT_TEST') {
        if (this.config.modules.alerts) this.enqueueAlert(msg.payload || {});
      } else if (msg.type === 'SET_PREVIEW_PINNED') {
        this.setPreviewPinned(Boolean(msg.pinned));
      } else if (msg.type === 'LIVE_CONFIG_UPDATE') {
        const s = msg.state;
        this.config.posX = parseFloat(s.x); this.config.posY = parseFloat(s.y); this.config.scale = parseFloat(s.scale);
        this.config.alignH = s.alignH === '1'; this.config.alignV = s.alignV === '1';
        this.config.noBg = s.noBg === '1'; this.config.duration = parseInt(s.duration, 10) * 1000;
        this.config.cardAnim = s.cardAnim; this.config.avatarAnim = s.avatarAnim;
        
        this.config.alertX = parseFloat(s.ax); this.config.alertY = parseFloat(s.ay); this.config.alertScale = parseFloat(s.ascale);
        this.config.alertAlignH = s.aAlignH === '1'; this.config.alertAlignV = s.aAlignV === '1';
        this.config.alertDuration = parseInt(s.aDur, 10) * 1000;
        
        this.config.fontHeading = s.fontHeading; this.config.fontBody = s.fontBody; this.config.bgUrl = s.bg;
        this.config.colors = { pink: s.cPink, teal: s.cTeal, purple: s.cPurple, yellow: s.cYellow, iconStroke: s.cStroke, border: s.cBorder, bgFill: s.cBg };
        
        try { this.config.stats = JSON.parse(s.stats); } catch (e) {}
        this.renderStatRows(this.lastWalkonData);
        this.applyGlobalStyles();
      }
    });
  }

  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  // =====================================
  // WALKON CARD PLAYBACK
  // =====================================
  enqueueWalkOn(data) {
    this.walkonQueue.push(data);
    if (!this.isWalkonAnimating) this.processWalkonQueue();
  }

  async processWalkonQueue() {
    if (this.walkonQueue.length === 0) {
      this.isWalkonAnimating = false;
      if (this.config.previewMode) { await this.wait(250); this.dom.walkonContainer.classList.add('animate-in'); }
      return;
    }
    this.isWalkonAnimating = true;
    const current = this.walkonQueue.shift();
    await this.playWalkOn(current);
    this.processWalkonQueue();
  }

  async playWalkOn(raw) {
    this.lastWalkonData = raw;
    if (this.dom.walkonContainer.classList.contains('animate-in')) {
      this.dom.walkonContainer.classList.remove('animate-in');
      await this.wait(450);
    }

    const userName = this.getField(raw, 'userName', ['user', 'targetUser', 'displayName']) || 'ViceCityLegend';
    const avatarUrl = this.getField(raw, this.config.varAvatar, ['avatarUrl', 'userProfileUrl', 'avatar']) || DEFAULT_AVATAR_SVG;
    const levelName = this.getField(raw, this.config.varTier, ['levelName', 'tier', 'role']) || 'VIP Member';

    document.getElementById('card-avatar').src = avatarUrl;
    document.getElementById('card-username').textContent = userName;
    document.getElementById('card-tier').textContent = String(levelName).toUpperCase();
    this.renderStatRows(raw);
    
    if (this.dom.avatarWrap) {
      this.dom.avatarWrap.className = 'avatar-wrapper ' + this.config.avatarAnim;
    }

    void this.dom.walkonContainer.offsetWidth; // Reflow
    this.dom.walkonContainer.classList.add('animate-in');
    await this.wait(this.config.duration);
    this.dom.walkonContainer.classList.remove('animate-in');
    await this.wait(650);
  }

  // =====================================
  // ALERTS PLAYBACK
  // =====================================
  enqueueAlert(data) {
    // Check toggle before queuing
    const t = data.alertType || 'generic';
    if (t !== 'generic' && this.config.alertsConfig[t] === false) return;
    
    this.alertQueue.push(data);
    if (!this.isAlertAnimating) this.processAlertQueue();
  }

  async processAlertQueue() {
    if (this.alertQueue.length === 0) {
      this.isAlertAnimating = false;
      if (this.config.previewMode) { 
        await this.wait(250); 
        this.dom.alertContainer.classList.add('animate-in'); 
      }
      return;
    }
    this.isAlertAnimating = true;
    const current = this.alertQueue.shift();
    await this.playAlert(current);
    this.processAlertQueue();
  }

  async playAlert(raw) {
    if (this.dom.alertContainer.classList.contains('animate-in')) {
      this.dom.alertContainer.classList.remove('animate-in');
      await this.wait(450);
    }

    const type = raw.alertType || 'sub';
    this.dom.alertBox.className = `alert-box alert-${type}`;

    const triggerName = this.getField(raw, 'triggerName') || 'New Event';
    const userName = this.getField(raw, 'userName', ['user']) || 'Username';
    const avatarUrl = this.getField(raw, 'userProfileUrl', ['avatarUrl']) || DEFAULT_AVATAR_SVG;
    
    const message = this.getField(raw, 'message');
    const amount = this.getField(raw, 'amount');
    const levelName = this.getField(raw, 'levelName');
    const count = this.getField(raw, 'count');
    const months = this.getField(raw, 'months');
    const gifterUser = this.getField(raw, 'gifterUser');
    const stickerUrl = this.getField(raw, 'stickerImageUrl');
    const jewelsAmount = this.getField(raw, 'jewelsAmount');
    const jewelsName = this.getField(raw, 'jewelsName');
    const jewelsUrl = this.getField(raw, 'jewelsUrl');

    document.getElementById('alert-event-name').textContent = triggerName;
    document.getElementById('alert-user-name').textContent = userName;
    document.getElementById('alert-avatar').src = avatarUrl;

    const bodyEl = document.getElementById('alert-body');
    bodyEl.innerHTML = '';

    // Sub/Member basic detail
    if (type === 'member' && levelName) {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Tier</span><span class="alert-highlight">${levelName}</span></div>`;
    } else if (type === 'milestone') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Tenure</span><span class="alert-highlight">${months} Months</span></div>`;
      if (levelName) bodyEl.innerHTML += `<div class="alert-detail-row"><span>Tier</span><span class="alert-highlight">${levelName}</span></div>`;
    } else if (type === 'gift') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Gifted</span><span class="alert-highlight">${count} Memberships</span></div>`;
    } else if (type === 'giftRec') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>From</span><span class="alert-highlight">${gifterUser || 'Anonymous'}</span></div>`;
    } else if (type === 'superchat') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Amount</span><span class="alert-highlight amount">${amount}</span></div>`;
    } else if (type === 'supersticker') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Amount</span><span class="alert-highlight amount">${amount}</span></div>`;
      if (stickerUrl) bodyEl.innerHTML += `<div class="alert-media"><img src="${stickerUrl}" /></div>`;
    } else if (type === 'jewels') {
      bodyEl.innerHTML += `<div class="alert-detail-row"><span>Sent</span><span class="alert-highlight amount">${jewelsAmount} Jewels</span></div>`;
      if (jewelsName) bodyEl.innerHTML += `<div class="alert-detail-row"><span>Gift</span><span class="alert-highlight">${jewelsName}</span></div>`;
      if (jewelsUrl) bodyEl.innerHTML += `<div class="alert-media"><img src="${jewelsUrl}" /></div>`;
    }

    if (message) {
      bodyEl.innerHTML += `<div class="alert-message">${message}</div>`;
    }

    // Hide body if empty
    bodyEl.style.display = bodyEl.innerHTML === '' ? 'none' : 'flex';

    void this.dom.alertContainer.offsetWidth; // Reflow
    this.dom.alertContainer.classList.add('animate-in');
    
    await this.wait(this.config.alertDuration);
    this.dom.alertContainer.classList.remove('animate-in');
    await this.wait(600);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gtaOverlay = new GTAOverlayEngine(GTAOverlayConfig);
});
