/* ==========================================================================
   GTA VI OBS OVERLAYS - CORE ENGINE (js/overlays.js)
   v0.0.5 - 5-Module Suite (Walk-On Card, Alerts, Shoutout, Horizontal Chat, Q&A)
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

  const modulesParam   = params.get('modules') || 'all';
  const enableWalkon   = modulesParam === 'all' || modulesParam.includes('walkon');
  const enableAlerts   = modulesParam === 'all' || modulesParam.includes('alerts');
  const enableShoutout = modulesParam === 'all' || modulesParam.includes('shoutout');
  const enableChat     = modulesParam === 'all' || modulesParam.includes('chat');
  const enableQA       = modulesParam === 'all' || modulesParam.includes('qa');

  return {
    previewMode: params.get('preview') === '1',
    modules: {
      walkon:   enableWalkon,
      alerts:   enableAlerts,
      shoutout: enableShoutout,
      chat:     enableChat,
      qa:       enableQA
    },

    host: params.get('host') || '127.0.0.1',
    port: parseInt(params.get('port') || '8080', 10),
    endpoint: params.get('endpoint') || '/',
    password: params.get('password') || '',
    
    // Module 1: Walk-on Card Config
    walkonEvent: params.get('event') || 'MemberWalkOn',
    posX: parseFloat(params.get('x') || '60'),
    posY: parseFloat(params.get('y') || '60'),
    scale: parseFloat(params.get('scale') || '1'),
    alignH: params.get('alignH') === '1',
    alignV: params.get('alignV') === '1',
    duration: parseInt(params.get('duration') || '8', 10) * 1000,
    cardAnim: params.get('cardAnim') || 'anim-slide-left',
    avatarAnim: params.get('avatarAnim') || 'av-flip',
    showAvatar: params.get('showAvatar') !== '0',
    showUser: params.get('showUser') !== '0',
    showTier: params.get('showTier') !== '0',
    noBg: params.get('noBg') === '1',

    // Module 2: Alerts Config & Independent Accent Colors
    alertEvent: params.get('alertEvent') || 'GTA_Alert',
    alertX: parseFloat(params.get('ax') || '960'), 
    alertY: parseFloat(params.get('ay') || '100'), 
    alertScale: parseFloat(params.get('ascale') || '1'),
    alertAlignH: params.get('aAlignH') !== '0', 
    alertAlignV: params.get('aAlignV') === '1',
    alertDuration: parseInt(params.get('aDur') || '6', 10) * 1000,
    alertsConfig: {
      sub:          params.get('al_sub') !== '0',
      member:       params.get('al_mem') !== '0',
      milestone:    params.get('al_ms')  !== '0',
      gift:         params.get('al_gft') !== '0',
      giftRec:      params.get('al_grc') !== '0',
      superchat:    params.get('al_sc')  !== '0',
      supersticker: params.get('al_stk') !== '0',
      jewels:       params.get('al_jwl') !== '0'
    },
    alertColors: {
      sub:          params.get('ac_sub') || 'teal',
      member:       params.get('ac_mem') || 'purple',
      milestone:    params.get('ac_ms')  || 'purple',
      gift:         params.get('ac_gft') || 'pink',
      giftRec:      params.get('ac_grc') || 'teal',
      superchat:    params.get('ac_sc')  || 'yellow',
      supersticker: params.get('ac_stk') || 'yellow',
      jewels:       params.get('ac_jwl') || 'yellow'
    },

    // Module 3: Shoutout Toast Config
    soGlobalVar: params.get('soVar') || 'viShoutOuts',
    soEvent: params.get('soEvent') || 'GTA_Shoutout',
    soTitle: params.get('soTitle') || 'SHOUTOUT',
    soX: parseFloat(params.get('soX') || '1380'),
    soY: parseFloat(params.get('soY') || '80'),
    soScale: parseFloat(params.get('soScale') || '1'),
    soAlignH: params.get('soAlignH') === '1',
    soAlignV: params.get('soAlignV') === '1',
    soDuration: parseInt(params.get('soDur') || '5', 10) * 1000,
    soAnim: params.get('soAnim') || 'so-roll',
    soLayout: params.get('soLayout') || 'right',
    soColor: params.get('soColor') || 'pink',
    soNoBg: params.get('soNoBg') === '1',

    // Module 4: Horizontal Chat Bar Config
    chatEvent:        params.get('chatEvent') || 'GTA_Chat',
    chatX:            parseFloat(params.get('chatX') || '0'),
    chatY:            parseFloat(params.get('chatY') || '0'),
    chatW:            parseFloat(params.get('chatW') || '1920'),
    chatScale:        parseFloat(params.get('chatScale') || '1'),
    chatAlignH:       params.get('chatAlignH') === '1',
    chatAlignV:       params.get('chatAlignV') === '1',
    chatFontSize:     parseInt(params.get('chatFS') || '20', 10),
    chatMaxMsgs:      parseInt(params.get('chatMax') || '15', 10),
    chatHideAfter:    parseInt(params.get('chatHide') || '0', 10), // 0 = never auto-hide
    chatColorMember:  params.get('cMem') || '#53d8bf',   // Default Teal
    chatColorMod:     params.get('cMod') || '#a688ff',   // Default Purple
    chatColorViewer:  params.get('cView') || '#fede9a',  // Default Yellow
    chatColorMsg:     params.get('cMsg') || '#f0f4f8',
    chatBgColor:      params.get('cChatBg') || (params.get('cBg') || '#303030'),
    chatBgOpacity:    parseInt(params.get('chatBgOp') || '88', 10),
    chatNoBg:         params.get('chatNoBg') === '1',
    chatAccent:       params.get('chatAccent') || 'teal',
    chatShowAvatars:  params.get('chatAv') === '1',
    chatShowBadges:   params.get('chatBadges') !== '0',
    chatUppercase:    params.get('chatUpper') === '1',
    chatIgnoreCmds:   params.get('chatNoCmd') !== '0',
    chatCmdPrefixes:  params.get('chatPrefixes') || '!, #, /',
    chatIgnoreUsers:  params.get('chatIgUsers') || '',
    chatIgnoreGroups: params.get('chatIgGroups') || '',

    // Module 5: Q&A / Chat Highlight Toast Config
    qaGlobalVar: params.get('qaVar') || 'viChatHighlight',
    qaEvent:     params.get('qaEvent') || 'GTA_QA',
    qaTitle:     params.get('qaTitle') || 'Q&A HIGHLIGHT',
    qaX:         parseFloat(params.get('qaX') || '960'),
    qaY:         parseFloat(params.get('qaY') || '60'),
    qaScale:     parseFloat(params.get('qaScale') || '1'),
    qaAlignH:    params.get('qaAlignH') !== '0', // Default centered horizontally
    qaAlignV:    params.get('qaAlignV') === '1',
    qaDuration:  parseInt(params.get('qaDur') || '15', 10) * 1000,
    qaAnim:      params.get('qaAnim') || 'qa-slide-up',
    qaColor:     params.get('qaColor') || 'teal',
    qaShowBadge: params.get('qaShowBadge') !== '0',
    qaNoBg:      params.get('qaNoBg') === '1',

    // Shared Aesthetics & Colors
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

class GTAOverlayEngine {
  constructor(config) {
    this.config = config;
    this.client = null;
    
    this.walkonQueue = [];
    this.isWalkonAnimating = false;
    
    this.alertQueue = [];
    this.isAlertAnimating = false;

    this.shoutoutQueue = [];
    this.isShoutoutAnimating = false;
    this.lastShoutoutTs = 0;

    this.qaQueue = [];
    this.isQAAnimating = false;
    this.lastQATs = 0;

    this.chatMsgCounter = 0;
    
    this.lastWalkonData = {};
    this.lastAlertType = 'sub';

    this.dom = {
      walkonContainer:   document.getElementById('walkon-container'),
      walkonCard:        document.querySelector('.walkon-card'),
      avatarWrap:        document.getElementById('avatar-wrapper'),
      avatar:            document.getElementById('card-avatar'),
      username:          document.getElementById('card-username'),
      tier:              document.getElementById('card-tier'),
      metaBox:           document.getElementById('meta-box'),
      alertContainer:    document.getElementById('alert-container'),
      alertBox:          document.getElementById('alert-box'),
      shoutoutContainer: document.getElementById('shoutout-container'),
      shoutoutWrapper:   document.getElementById('shoutout-wrapper'),
      shoutoutTitle:     document.getElementById('shoutout-title'),
      shoutoutName:      document.getElementById('shoutout-name'),
      shoutoutAvatar:    document.getElementById('shoutout-avatar'),
      chatContainer:     document.getElementById('chat-container'),
      chatBar:           document.getElementById('chat-bar'),
      chatTrack:         document.getElementById('chat-track'),
      qaContainer:       document.getElementById('qa-container'),
      qaBox:             document.getElementById('qa-box'),
      qaAvatar:          document.getElementById('qa-avatar'),
      qaUsername:        document.getElementById('qa-username'),
      qaBadge:           document.getElementById('qa-badge'),
      qaMessage:         document.getElementById('qa-message')
    };

    [this.dom.avatar, document.getElementById('alert-avatar'), this.dom.shoutoutAvatar, this.dom.qaAvatar].forEach(imgEl => {
      if (imgEl) {
        imgEl.onerror = () => { if (imgEl.src !== DEFAULT_AVATAR_SVG) imgEl.src = DEFAULT_AVATAR_SVG; };
        if (!imgEl.getAttribute('src')) imgEl.src = DEFAULT_AVATAR_SVG;
      }
    });

    if (this.dom.walkonContainer && !this.config.modules.walkon) this.dom.walkonContainer.style.display = 'none';
    if (this.dom.alertContainer && !this.config.modules.alerts) this.dom.alertContainer.style.display = 'none';
    if (this.dom.shoutoutContainer && !this.config.modules.shoutout) this.dom.shoutoutContainer.style.display = 'none';
    if (this.dom.chatContainer && !this.config.modules.chat) this.dom.chatContainer.style.display = 'none';
    if (this.dom.qaContainer && !this.config.modules.qa) this.dom.qaContainer.style.display = 'none';

    if (this.config.modules.walkon) {
      this.renderStatRows({});
    }

    this.applyGlobalStyles();

    if (this.config.previewMode) {
      document.body.classList.add('preview-interactive');
      this.initStudioInteractivity();
      this.setPreviewPinned(true);
      if (this.config.modules.chat && this.dom.chatTrack && this.dom.chatTrack.children.length === 0) {
        this.seedPreviewChatMessages();
      }
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

  hexToRgba(hex, opacityPct) {
    let clean = (hex || '#303030').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const num = parseInt(clean, 16) || 0x303030;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const alpha = Math.max(0, Math.min(100, isNaN(opacityPct) ? 88 : opacityPct)) / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  resolveAccentTokens(colorVal) {
    const map = {
      pink:   { accent: 'var(--gta-pink)',   glow: 'var(--glow-pink)' },
      teal:   { accent: 'var(--gta-teal)',   glow: 'var(--glow-teal)' },
      purple: { accent: 'var(--gta-purple)', glow: 'var(--glow-purple)' },
      yellow: { accent: 'var(--gta-yellow)', glow: 'var(--glow-yellow)' }
    };
    if (map[colorVal]) return map[colorVal];
    if (typeof colorVal === 'string' && colorVal.startsWith('#')) {
      return {
        accent: colorVal,
        glow: `color-mix(in srgb, ${colorVal} 45%, transparent)`
      };
    }
    return map.teal;
  }

  applyAlertAccentColor(alertType) {
    if (!this.dom.alertBox) return;
    const chosenKey = (this.config.alertColors && this.config.alertColors[alertType]) || 'teal';
    const tokens = this.resolveAccentTokens(chosenKey);
    this.dom.alertBox.style.setProperty('--alert-accent', tokens.accent);
    this.dom.alertBox.style.setProperty('--alert-glow', tokens.glow);
  }

  applyShoutoutAccentColor() {
    if (!this.dom.shoutoutWrapper) return;
    const tokens = this.resolveAccentTokens(this.config.soColor || 'pink');
    this.dom.shoutoutWrapper.style.setProperty('--so-accent', tokens.accent);
    this.dom.shoutoutWrapper.style.setProperty('--so-glow', tokens.glow);
  }

  applyQAAccentColor() {
    if (!this.dom.qaBox) return;
    const tokens = this.resolveAccentTokens(this.config.qaColor || 'teal');
    this.dom.qaBox.style.setProperty('--qa-accent', tokens.accent);
    this.dom.qaBox.style.setProperty('--qa-glow', tokens.glow);
  }

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

    const resolvedBg = this.config.bgUrl ? `url("${this.resolveAssetUrl(this.config.bgUrl)}")` : 'none';

    // Module 1: Walk-On Card Styling
    if (this.config.modules.walkon && this.dom.walkonCard) {
      const wasPinned = this.dom.walkonContainer && this.dom.walkonContainer.classList.contains('animate-in');
      if (this.config.noBg || !this.config.bgUrl) {
        this.dom.walkonCard.classList.add('no-bg-image');
        root.style.setProperty('--card-bg-image', 'none');
      } else {
        this.dom.walkonCard.classList.remove('no-bg-image');
        root.style.setProperty('--card-bg-image', resolvedBg);
      }
      if (this.dom.walkonContainer) {
        this.dom.walkonContainer.className = `walkon-container ${this.config.cardAnim}` + (wasPinned ? ' animate-in' : '');
      }
      if (this.dom.avatarWrap) this.dom.avatarWrap.style.display = this.config.showAvatar ? 'block' : 'none';
      if (this.dom.username) this.dom.username.style.display = this.config.showUser ? 'block' : 'none';
      if (this.dom.tier) this.dom.tier.style.display = this.config.showTier ? 'inline-block' : 'none';
      this.recalculateWalkonCoords();
    }

    // Module 2: Alerts Styling
    if (this.config.modules.alerts) {
      this.applyAlertAccentColor(this.lastAlertType || 'sub');
      this.recalculateAlertCoords();
    }

    // Module 3: Shoutout Toast Styling
    if (this.config.modules.shoutout && this.dom.shoutoutWrapper) {
      const wasSoPinned = this.dom.shoutoutContainer && this.dom.shoutoutContainer.classList.contains('animate-in');
      if (this.config.soNoBg || !this.config.bgUrl) {
        this.dom.shoutoutWrapper.classList.add('no-bg-image');
        root.style.setProperty('--so-bg-image', 'none');
      } else {
        this.dom.shoutoutWrapper.classList.remove('no-bg-image');
        root.style.setProperty('--so-bg-image', resolvedBg);
      }
      this.dom.shoutoutWrapper.classList.toggle('avatar-left', this.config.soLayout === 'left');
      this.applyShoutoutAccentColor();
      if (this.dom.shoutoutTitle) {
        this.dom.shoutoutTitle.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${this.config.soTitle || 'SHOUTOUT'}`;
      }
      if (this.dom.shoutoutContainer) {
        this.dom.shoutoutContainer.className = `shoutout-container ${this.config.soAnim}` + (wasSoPinned ? ' animate-in' : '');
      }
      this.recalculateShoutoutCoords();
    }

    // Module 4: Horizontal Chat Bar Styling
    if (this.config.modules.chat && this.dom.chatBar) {
      root.style.setProperty('--chat-w', `${Math.round(this.config.chatW || 1920)}px`);
      root.style.setProperty('--chat-font-size', `${this.config.chatFontSize || 20}px`);
      root.style.setProperty('--chat-color-member', this.config.chatColorMember || 'var(--gta-teal)');
      root.style.setProperty('--chat-color-mod', this.config.chatColorMod || 'var(--gta-purple)');
      root.style.setProperty('--chat-color-viewer', this.config.chatColorViewer || 'var(--gta-yellow)');
      root.style.setProperty('--chat-color-msg', this.config.chatColorMsg || '#f0f4f8');
      root.style.setProperty('--chat-bg', this.hexToRgba(this.config.chatBgColor || this.config.colors.bgFill, this.config.chatBgOpacity));
      const chatTokens = this.resolveAccentTokens(this.config.chatAccent || 'teal');
      root.style.setProperty('--chat-accent', chatTokens.accent);
      this.dom.chatBar.classList.toggle('no-bg-fill', Boolean(this.config.chatNoBg));
      this.recalculateChatCoords();
    }

    // Module 5: Q&A Highlight Toast Styling
    if (this.config.modules.qa && this.dom.qaBox) {
      const wasQAPinned = this.dom.qaContainer && this.dom.qaContainer.classList.contains('animate-in');
      if (this.config.qaNoBg || !this.config.bgUrl) {
        this.dom.qaBox.classList.add('no-bg-image');
        root.style.setProperty('--qa-bg-image', 'none');
      } else {
        this.dom.qaBox.classList.remove('no-bg-image');
        root.style.setProperty('--qa-bg-image', resolvedBg);
      }
      this.applyQAAccentColor();
      if (this.dom.qaBadge) {
        this.dom.qaBadge.style.display = this.config.qaShowBadge ? 'inline-flex' : 'none';
        this.dom.qaBadge.innerHTML = `<i class="fa-solid fa-comments"></i> ${this.config.qaTitle || 'Q&A HIGHLIGHT'}`;
      }
      if (this.dom.qaContainer) {
        this.dom.qaContainer.className = `qa-container ${this.config.qaAnim}` + (wasQAPinned ? ' animate-in' : '');
      }
      this.recalculateQACoords();
    }
    
    this.updateDomCoords();
  }

  recalculateWalkonCoords() {
    if (!this.dom.walkonContainer) return;
    const scale = this.config.scale || 1;
    const w = this.dom.walkonContainer.offsetWidth || 340;
    const h = this.dom.walkonContainer.offsetHeight || 390;
    const maxX = Math.max(0, 1920 - (w * scale));
    const maxY = Math.max(0, 1080 - (h * scale));
    if (this.config.alignH) this.config.posX = Math.round(maxX / 2);
    else this.config.posX = Math.round(Math.max(0, Math.min(maxX, this.config.posX)));
    if (this.config.alignV) this.config.posY = Math.round(maxY / 2);
    else this.config.posY = Math.round(Math.max(0, Math.min(maxY, this.config.posY)));
  }

  recalculateAlertCoords() {
    if (!this.dom.alertContainer) return;
    const scale = this.config.alertScale || 1;
    const w = this.dom.alertContainer.offsetWidth || 460;
    const h = this.dom.alertContainer.offsetHeight || 140;
    const halfW = (w * scale) / 2;
    const maxY = Math.max(0, 1080 - (h * scale));
    if (this.config.alertAlignH) this.config.alertX = 960;
    else this.config.alertX = Math.round(Math.max(halfW, Math.min(1920 - halfW, this.config.alertX)));
    if (this.config.alertAlignV) this.config.alertY = Math.round(maxY / 2);
    else this.config.alertY = Math.round(Math.max(0, Math.min(maxY, this.config.alertY)));
  }

  recalculateShoutoutCoords() {
    if (!this.dom.shoutoutContainer) return;
    const scale = this.config.soScale || 1;
    const w = this.dom.shoutoutContainer.offsetWidth || 360;
    const h = this.dom.shoutoutContainer.offsetHeight || 104;
    const maxX = Math.max(0, 1920 - (w * scale));
    const maxY = Math.max(0, 1080 - (h * scale));
    if (this.config.soAlignH) this.config.soX = Math.round(maxX / 2);
    else this.config.soX = Math.round(Math.max(0, Math.min(maxX, this.config.soX)));
    if (this.config.soAlignV) this.config.soY = Math.round(maxY / 2);
    else this.config.soY = Math.round(Math.max(0, Math.min(maxY, this.config.soY)));
  }

  recalculateChatCoords() {
    if (!this.dom.chatContainer) return;
    const scale = this.config.chatScale || 1;
    const w = this.config.chatW || 1920;
    const h = this.dom.chatContainer.offsetHeight || 56;
    const maxX = Math.max(0, 1920 - (w * scale));
    const maxY = Math.max(0, 1080 - (h * scale));
    if (this.config.chatAlignH) this.config.chatX = Math.round(maxX / 2);
    else this.config.chatX = Math.round(Math.max(0, Math.min(maxX, this.config.chatX)));
    if (this.config.chatAlignV) this.config.chatY = Math.round(maxY / 2);
    else this.config.chatY = Math.round(Math.max(0, Math.min(maxY, this.config.chatY)));
  }

  recalculateQACoords() {
    if (!this.dom.qaContainer) return;
    const scale = this.config.qaScale || 1;
    const w = this.dom.qaContainer.offsetWidth || 600;
    const h = this.dom.qaContainer.offsetHeight || 120;
    const halfW = (w * scale) / 2;
    const maxY = Math.max(0, 1080 - (h * scale));
    if (this.config.qaAlignH) this.config.qaX = 960;
    else this.config.qaX = Math.round(Math.max(halfW, Math.min(1920 - halfW, this.config.qaX)));
    if (this.config.qaAlignV) this.config.qaY = Math.round(maxY / 2);
    else this.config.qaY = Math.round(Math.max(0, Math.min(maxY, this.config.qaY)));
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
    if (this.config.modules.shoutout) {
      root.style.setProperty('--so-scale', this.config.soScale);
      root.style.setProperty('--so-x', `${Math.round(this.config.soX)}px`);
      root.style.setProperty('--so-y', `${Math.round(this.config.soY)}px`);
    }
    if (this.config.modules.chat) {
      root.style.setProperty('--chat-scale', this.config.chatScale);
      root.style.setProperty('--chat-x', `${Math.round(this.config.chatX)}px`);
      root.style.setProperty('--chat-y', `${Math.round(this.config.chatY)}px`);
      root.style.setProperty('--chat-w', `${Math.round(this.config.chatW)}px`);
    }
    if (this.config.modules.qa) {
      root.style.setProperty('--qa-scale', this.config.qaScale);
      root.style.setProperty('--qa-x', `${Math.round(this.config.qaX)}px`);
      root.style.setProperty('--qa-y', `${Math.round(this.config.qaY)}px`);
    }
  }

  setPreviewPinned(pinned) {
    this.config.previewMode = pinned;
    if (pinned) {
      document.body.classList.add('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating && this.dom.walkonContainer) this.dom.walkonContainer.classList.add('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating && this.dom.alertContainer) this.dom.alertContainer.classList.add('animate-in');
      if (this.config.modules.shoutout && !this.isShoutoutAnimating && this.dom.shoutoutContainer) this.dom.shoutoutContainer.classList.add('animate-in');
      if (this.config.modules.chat && this.dom.chatContainer) this.dom.chatContainer.classList.add('animate-in');
      if (this.config.modules.qa && !this.isQAAnimating && this.dom.qaContainer) this.dom.qaContainer.classList.add('animate-in');
    } else {
      document.body.classList.remove('preview-interactive');
      if (this.config.modules.walkon && !this.isWalkonAnimating && this.dom.walkonContainer) this.dom.walkonContainer.classList.remove('animate-in');
      if (this.config.modules.alerts && !this.isAlertAnimating && this.dom.alertContainer) this.dom.alertContainer.classList.remove('animate-in');
      if (this.config.modules.shoutout && !this.isShoutoutAnimating && this.dom.shoutoutContainer) this.dom.shoutoutContainer.classList.remove('animate-in');
      if (this.config.modules.chat && this.dom.chatContainer) this.dom.chatContainer.classList.remove('animate-in');
      if (this.config.modules.qa && !this.isQAAnimating && this.dom.qaContainer) this.dom.qaContainer.classList.remove('animate-in');
    }
  }

  renderStatRows(data = {}) {
    const metaBox = this.dom.metaBox;
    if (!metaBox) return;
    metaBox.innerHTML = '';

    if (!this.config.stats || this.config.stats.length === 0) {
      metaBox.classList.add('empty-stats');
      return;
    }
    metaBox.classList.remove('empty-stats');

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
      metaBox.appendChild(row);
    });
  }

  initStudioInteractivity() {
    const guideV = document.createElement('div'); guideV.className = 'snap-guide vertical'; guideV.style.left = '960px'; document.body.appendChild(guideV);
    const guideH = document.createElement('div'); guideH.className = 'snap-guide horizontal'; guideH.style.top = '540px'; document.body.appendChild(guideH);

    this.setupDraggable(this.dom.walkonContainer, 'walkon', guideV, guideH);
    this.setupDraggable(this.dom.alertContainer, 'alert', guideV, guideH);
    this.setupDraggable(this.dom.shoutoutContainer, 'shoutout', guideV, guideH);
    this.setupDraggable(this.dom.chatContainer, 'chat', guideV, guideH);
    this.setupDraggable(this.dom.qaContainer, 'qa', guideV, guideH);
  }

  setupDraggable(container, modType, guideV, guideH) {
    if (!container) return;

    const labels = {
      walkon:   'Walk-On Card',
      alert:    'Alert Box',
      shoutout: 'Shoutout Toast',
      chat:     'Horizontal Chat Bar',
      qa:       'Q&A Highlight Toast'
    };
    const dragPill = document.createElement('div');
    dragPill.className = 'studio-drag-pill';
    dragPill.innerHTML = `<i class="fa-solid fa-up-down-left-right"></i> ${labels[modType]}`;
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
      if ((modType === 'walkon' && this.isWalkonAnimating) ||
          (modType === 'alert' && this.isAlertAnimating) ||
          (modType === 'shoutout' && this.isShoutoutAnimating) ||
          (modType === 'qa' && this.isQAAnimating)) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startObjX = modType === 'walkon' ? this.config.posX :
                 (modType === 'alert' ? this.config.alertX :
                 (modType === 'shoutout' ? this.config.soX :
                 (modType === 'chat' ? this.config.chatX : this.config.qaX)));
      startObjY = modType === 'walkon' ? this.config.posY :
                 (modType === 'alert' ? this.config.alertY :
                 (modType === 'shoutout' ? this.config.soY :
                 (modType === 'chat' ? this.config.chatY : this.config.qaY)));
      baseW = container.offsetWidth; baseH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    resizeHandle.addEventListener('mousedown', (e) => {
      if (!this.config.previewMode) return;
      e.stopPropagation(); e.preventDefault();
      isResizing = true;
      startX = e.clientX; startY = e.clientY;
      startScale = modType === 'walkon' ? this.config.scale :
                  (modType === 'alert' ? this.config.alertScale :
                  (modType === 'shoutout' ? this.config.soScale :
                  (modType === 'chat' ? this.config.chatScale : this.config.qaScale)));
      baseW = container.offsetWidth; baseH = container.offsetHeight;
      container.classList.add('is-manipulating');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (isDragging) {
        const scale = modType === 'walkon' ? this.config.scale :
                     (modType === 'alert' ? this.config.alertScale :
                     (modType === 'shoutout' ? this.config.soScale :
                     (modType === 'chat' ? this.config.chatScale : this.config.qaScale)));
        let nextX = 0, nextY = 0;

        if (modType === 'walkon') {
          nextX = Math.round(Math.max(0, Math.min(1920 - (baseW * scale), startObjX + dx)));
          nextY = Math.round(Math.max(0, Math.min(1080 - (baseH * scale), startObjY - dy))); // Bottom-left
          if (!e.altKey) {
            const cx = Math.round((1920 - (baseW * scale)) / 2);
            const cy = Math.round((1080 - (baseH * scale)) / 2);
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.alignH = false; this.config.alignV = false;
          this.config.posX = nextX; this.config.posY = nextY;
        } else if (modType === 'alert') {
          nextX = Math.round(Math.max((baseW * scale)/2, Math.min(1920 - (baseW * scale)/2, startObjX + dx)));
          nextY = Math.round(Math.max(0, Math.min(1080 - (baseH * scale), startObjY + dy))); // Top-center
          if (!e.altKey) {
            const cx = 960;
            const cy = Math.round((1080 - (baseH * scale)) / 2);
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.alertAlignH = false; this.config.alertAlignV = false;
          this.config.alertX = nextX; this.config.alertY = nextY;
        } else if (modType === 'shoutout') {
          nextX = Math.round(Math.max(0, Math.min(1920 - (baseW * scale), startObjX + dx)));
          nextY = Math.round(Math.max(0, Math.min(1080 - (baseH * scale), startObjY + dy))); // Top-left
          if (!e.altKey) {
            const cx = Math.round((1920 - (baseW * scale)) / 2);
            const cy = Math.round((1080 - (baseH * scale)) / 2);
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.soAlignH = false; this.config.soAlignV = false;
          this.config.soX = nextX; this.config.soY = nextY;
        } else if (modType === 'chat') {
          nextX = Math.round(Math.max(0, Math.min(1920 - (baseW * scale), startObjX + dx)));
          nextY = Math.round(Math.max(0, Math.min(1080 - (baseH * scale), startObjY - dy))); // Bottom-left
          if (!e.altKey) {
            const cx = Math.round((1920 - (baseW * scale)) / 2);
            const cy = Math.round((1080 - (baseH * scale)) / 2);
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.chatAlignH = false; this.config.chatAlignV = false;
          this.config.chatX = nextX; this.config.chatY = nextY;
        } else if (modType === 'qa') {
          nextX = Math.round(Math.max((baseW * scale)/2, Math.min(1920 - (baseW * scale)/2, startObjX + dx)));
          nextY = Math.round(Math.max(0, Math.min(1080 - (baseH * scale), startObjY - dy))); // Bottom-center
          if (!e.altKey) {
            const cx = 960;
            const cy = Math.round((1080 - (baseH * scale)) / 2);
            guideV.style.display = Math.abs(nextX - cx) < SNAP ? 'block' : 'none';
            guideH.style.display = Math.abs(nextY - cy) < SNAP ? 'block' : 'none';
            if (guideV.style.display === 'block') nextX = cx;
            if (guideH.style.display === 'block') nextY = cy;
          }
          this.config.qaAlignH = false; this.config.qaAlignV = false;
          this.config.qaX = nextX; this.config.qaY = nextY;
        }

        this.updateDomCoords();
        this.broadcastManipulate(modType);

      } else if (isResizing) {
        const isBottomAnchored = (modType === 'walkon' || modType === 'chat' || modType === 'qa');
        const isCenteredX = (modType === 'alert' || modType === 'qa');
        const vDelta = isBottomAnchored ? -dy : dy;
        const hDelta = isCenteredX ? (dx * 2) : dx;
        const delta = Math.abs(hDelta) >= Math.abs(vDelta) ? hDelta : vDelta;

        const startScaledW = Math.max(80, baseW * startScale);
        const rawScale = startScale * ((startScaledW + delta) / startScaledW);
        const newScale = Math.round(Math.max(0.5, Math.min(2.0, rawScale)) * 20) / 20;
        
        if (modType === 'walkon') {
          this.config.scale = newScale;
          this.recalculateWalkonCoords();
        } else if (modType === 'alert') {
          this.config.alertScale = newScale;
          this.recalculateAlertCoords();
        } else if (modType === 'shoutout') {
          this.config.soScale = newScale;
          this.recalculateShoutoutCoords();
        } else if (modType === 'chat') {
          this.config.chatScale = newScale;
          this.recalculateChatCoords();
        } else if (modType === 'qa') {
          this.config.qaScale = newScale;
          this.recalculateQACoords();
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
    } else if (modType === 'alert') {
      window.parent.postMessage({ type: 'ALERT_MANIPULATED', ax: this.config.alertX, ay: this.config.alertY, ascale: this.config.alertScale, aAlignH: this.config.alertAlignH, aAlignV: this.config.alertAlignV }, '*');
    } else if (modType === 'shoutout') {
      window.parent.postMessage({ type: 'SHOUTOUT_MANIPULATED', soX: this.config.soX, soY: this.config.soY, soScale: this.config.soScale, soAlignH: this.config.soAlignH, soAlignV: this.config.soAlignV }, '*');
    } else if (modType === 'chat') {
      window.parent.postMessage({ type: 'CHAT_MANIPULATED', chatX: this.config.chatX, chatY: this.config.chatY, chatScale: this.config.chatScale, chatAlignH: this.config.chatAlignH, chatAlignV: this.config.chatAlignV }, '*');
    } else if (modType === 'qa') {
      window.parent.postMessage({ type: 'QA_MANIPULATED', qaX: this.config.qaX, qaY: this.config.qaY, qaScale: this.config.qaScale, qaAlignH: this.config.qaAlignH, qaAlignV: this.config.qaAlignV }, '*');
    }
  }

  initWebSocket() {
    if (this.config.previewMode && window.parent !== window) return; 
    if (typeof StreamerbotClient === 'undefined') return;

    const opts = { 
      host: this.config.host, 
      port: this.config.port, 
      endpoint: this.config.endpoint, 
      subscribe: {
        General: ['Custom'],
        Misc: ['GlobalVariableUpdated'],
        YouTube: ['Message', 'MessageDeleted', 'UserBanned'],
        Twitch: ['ChatMessage', 'ChatMessageDeleted', 'UserTimedOut', 'UserBanned']
      },
      onConnect: () => {
        console.log(`[GTA-Overlay] Connected to Streamer.bot (${this.config.host}:${this.config.port})`);
      },
      onDisconnect: () => {
        console.warn('[GTA-Overlay] Disconnected from Streamer.bot.');
      }
    };
    
    if (this.config.password) opts.password = this.config.password;

    this.client = new StreamerbotClient(opts);
    
    // 1. Custom Broadcast Listener (Walk-On, Alerts, Shoutout, Chat, Q&A)
    this.client.on('General.Custom', (payload) => {
      let data = payload?.data ?? payload;
      if (typeof data === 'string') try { data = JSON.parse(data); } catch(e){}
      if (data?.data && typeof data.data === 'object' && !data.event) data = data.data;
      else if (data?.data && typeof data.data === 'string') try { data = JSON.parse(data.data); } catch(e){}

      if (!data) return;
      const ev = data.event || data.type;
      if (ev === this.config.walkonEvent) {
        if (this.config.modules.walkon) this.enqueueWalkOn(data);
      } else if (ev === this.config.alertEvent) {
        if (this.config.modules.alerts) this.enqueueAlert(data);
      } else if (ev === this.config.soEvent) {
        if (this.config.modules.shoutout) this.enqueueShoutout(data);
      } else if (ev === this.config.chatEvent) {
        if (this.config.modules.chat) this.handleIncomingChatMessage(data);
      } else if (ev === this.config.qaEvent) {
        if (this.config.modules.qa) this.enqueueQA(data);
      }
    });

    // 2. Global Variable Updated Listener (viShoutOuts & viChatHighlight)
    this.client.on('Misc.GlobalVariableUpdated', (payload) => {
      const varName = payload?.data?.name;
      const newValue = payload?.data?.newValue;
      if (!varName || !newValue) return;

      if (this.config.modules.shoutout && varName === this.config.soGlobalVar) {
        try {
          const soData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
          this.enqueueShoutout(soData);
        } catch (err) {
          console.error('[GTA-Overlay] Failed to parse shoutout global JSON:', err);
        }
      } else if (this.config.modules.qa && varName === this.config.qaGlobalVar) {
        try {
          const qaData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
          this.enqueueQA(qaData);
        } catch (err) {
          console.error('[GTA-Overlay] Failed to parse Q&A global JSON:', err);
        }
      }
    });

    // 3. Live YouTube & Twitch Chat Listeners for Horizontal Chat Module
    if (this.config.modules.chat) {
      this.client.on('YouTube.Message', (payload) => {
        const d = payload?.data || payload;
        this.handleYouTubeChatEvent(d);
      });
      this.client.on('YouTube.MessageDeleted', (payload) => {
        const msgId = payload?.data?.eventId || payload?.data?.messageId;
        if (msgId) this.removeChatMessageById(msgId);
      });
      this.client.on('YouTube.UserBanned', (payload) => {
        const uId = payload?.data?.bannedUser?.id || payload?.data?.user?.id;
        if (uId) this.removeChatMessagesByUser(uId);
      });

      this.client.on('Twitch.ChatMessage', (payload) => {
        const d = payload?.data?.message || payload?.data || payload;
        this.handleTwitchChatEvent(d);
      });
      this.client.on('Twitch.ChatMessageDeleted', (payload) => {
        const msgId = payload?.data?.targetMessageId || payload?.data?.messageId;
        if (msgId) this.removeChatMessageById(msgId);
      });
      this.client.on('Twitch.UserTimedOut', (payload) => {
        const uId = payload?.data?.user_id || payload?.data?.userId;
        if (uId) this.removeChatMessagesByUser(uId);
      });
      this.client.on('Twitch.UserBanned', (payload) => {
        const uId = payload?.data?.user_id || payload?.data?.userId;
        if (uId) this.removeChatMessagesByUser(uId);
      });
    }
  }

  initPostMessageBridge() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'TRIGGER_WALKON_TEST') {
        if (this.config.modules.walkon) this.enqueueWalkOn(msg.payload || {});
      } else if (msg.type === 'TRIGGER_ALERT_TEST') {
        if (this.config.modules.alerts) this.enqueueAlert(msg.payload || {});
      } else if (msg.type === 'TRIGGER_SHOUTOUT_TEST') {
        if (this.config.modules.shoutout) this.enqueueShoutout(msg.payload || {});
      } else if (msg.type === 'TRIGGER_CHAT_TEST') {
        if (this.config.modules.chat) this.handleIncomingChatMessage(msg.payload || {});
      } else if (msg.type === 'TRIGGER_QA_TEST') {
        if (this.config.modules.qa) this.enqueueQA(msg.payload || {});
      } else if (msg.type === 'SET_PREVIEW_PINNED') {
        this.setPreviewPinned(Boolean(msg.pinned));
      } else if (msg.type === 'LIVE_CONFIG_UPDATE') {
        const s = msg.state;
        // Walk-on
        this.config.posX = parseFloat(s.x); this.config.posY = parseFloat(s.y); this.config.scale = parseFloat(s.scale);
        this.config.alignH = s.alignH === '1'; this.config.alignV = s.alignV === '1';
        this.config.noBg = s.noBg === '1'; this.config.duration = parseInt(s.duration, 10) * 1000;
        this.config.cardAnim = s.cardAnim; this.config.avatarAnim = s.avatarAnim;
        this.config.showAvatar = s.showAvatar !== '0';
        this.config.showUser = s.showUser !== '0';
        this.config.showTier = s.showTier !== '0';
        
        // Alerts
        this.config.alertX = parseFloat(s.ax); this.config.alertY = parseFloat(s.ay); this.config.alertScale = parseFloat(s.ascale);
        this.config.alertAlignH = s.aAlignH === '1'; this.config.alertAlignV = s.aAlignV === '1';
        this.config.alertDuration = parseInt(s.aDur, 10) * 1000;
        this.config.alertsConfig = {
          sub:          s.al_sub !== '0',
          member:       s.al_mem !== '0',
          milestone:    s.al_ms  !== '0',
          gift:         s.al_gft !== '0',
          giftRec:      s.al_grc !== '0',
          superchat:    s.al_sc  !== '0',
          supersticker: s.al_stk !== '0',
          jewels:       s.al_jwl !== '0'
        };
        this.config.alertColors = {
          sub:          s.ac_sub || 'teal',
          member:       s.ac_mem || 'purple',
          milestone:    s.ac_ms  || 'purple',
          gift:         s.ac_gft || 'pink',
          giftRec:      s.ac_grc || 'teal',
          superchat:    s.ac_sc  || 'yellow',
          supersticker: s.ac_stk || 'yellow',
          jewels:       s.ac_jwl || 'yellow'
        };

        // Shoutout
        this.config.soGlobalVar = s.soVar || 'viShoutOuts';
        this.config.soEvent = s.soEvent || 'GTA_Shoutout';
        this.config.soTitle = s.soTitle || 'SHOUTOUT';
        this.config.soX = parseFloat(s.soX || '1380');
        this.config.soY = parseFloat(s.soY || '80');
        this.config.soScale = parseFloat(s.soScale || '1');
        this.config.soAlignH = s.soAlignH === '1';
        this.config.soAlignV = s.soAlignV === '1';
        this.config.soDuration = parseInt(s.soDur || '5', 10) * 1000;
        this.config.soAnim = s.soAnim || 'so-roll';
        this.config.soLayout = s.soLayout || 'right';
        this.config.soColor = s.soColor || 'pink';
        this.config.soNoBg = s.soNoBg === '1';

        // Horizontal Chat
        this.config.chatEvent        = s.chatEvent || 'GTA_Chat';
        this.config.chatX            = parseFloat(s.chatX || '0');
        this.config.chatY            = parseFloat(s.chatY || '0');
        this.config.chatW            = parseFloat(s.chatW || '1920');
        this.config.chatScale        = parseFloat(s.chatScale || '1');
        this.config.chatAlignH       = s.chatAlignH === '1';
        this.config.chatAlignV       = s.chatAlignV === '1';
        this.config.chatFontSize     = parseInt(s.chatFS || '20', 10);
        this.config.chatMaxMsgs      = parseInt(s.chatMax || '15', 10);
        this.config.chatHideAfter    = parseInt(s.chatHide || '0', 10);
        this.config.chatColorMember  = s.cMem || '#53d8bf';
        this.config.chatColorMod     = s.cMod || '#a688ff';
        this.config.chatColorViewer  = s.cView || '#fede9a';
        this.config.chatColorMsg     = s.cMsg || '#f0f4f8';
        this.config.chatBgColor      = s.cChatBg || s.cBg || '#303030';
        this.config.chatBgOpacity    = parseInt(s.chatBgOp || '88', 10);
        this.config.chatNoBg         = s.chatNoBg === '1';
        this.config.chatAccent       = s.chatAccent || 'teal';
        this.config.chatShowAvatars  = s.chatAv === '1';
        this.config.chatShowBadges   = s.chatBadges !== '0';
        this.config.chatUppercase    = s.chatUpper === '1';
        this.config.chatIgnoreCmds   = s.chatNoCmd !== '0';
        this.config.chatCmdPrefixes  = s.chatPrefixes || '!, #, /';
        this.config.chatIgnoreUsers  = s.chatIgUsers || '';
        this.config.chatIgnoreGroups = s.chatIgGroups || '';

        // Q&A Highlight Toast
        this.config.qaGlobalVar = s.qaVar || 'viChatHighlight';
        this.config.qaEvent     = s.qaEvent || 'GTA_QA';
        this.config.qaTitle     = s.qaTitle || 'Q&A HIGHLIGHT';
        this.config.qaX         = parseFloat(s.qaX || '960');
        this.config.qaY         = parseFloat(s.qaY || '60');
        this.config.qaScale     = parseFloat(s.qaScale || '1');
        this.config.qaAlignH    = s.qaAlignH === '1';
        this.config.qaAlignV    = s.qaAlignV === '1';
        this.config.qaDuration  = parseInt(s.qaDur || '15', 10) * 1000;
        this.config.qaAnim      = s.qaAnim || 'qa-slide-up';
        this.config.qaColor     = s.qaColor || 'teal';
        this.config.qaShowBadge = s.qaShowBadge !== '0';
        this.config.qaNoBg      = s.qaNoBg === '1';
        
        this.config.fontHeading = s.fontHeading; this.config.fontBody = s.fontBody; this.config.bgUrl = s.bg;
        this.config.colors = { pink: s.cPink, teal: s.cTeal, purple: s.cPurple, yellow: s.cYellow, iconStroke: s.cStroke, border: s.cBorder, bgFill: s.cBg };
        
        try { this.config.stats = JSON.parse(s.stats); } catch (e) {}
        this.renderStatRows(this.lastWalkonData);
        this.applyGlobalStyles();

        if (this.config.previewMode && window.parent !== window) {
          if (this.config.alignH || this.config.alignV) this.broadcastManipulate('walkon');
          if (this.config.alertAlignH || this.config.alertAlignV) this.broadcastManipulate('alert');
          if (this.config.soAlignH || this.config.soAlignV) this.broadcastManipulate('shoutout');
          if (this.config.chatAlignH || this.config.chatAlignV) this.broadcastManipulate('chat');
          if (this.config.qaAlignH || this.config.qaAlignV) this.broadcastManipulate('qa');
        }
      }
    });
  }

  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  // =====================================
  // MODULE 1: WALKON CARD PLAYBACK
  // =====================================
  enqueueWalkOn(data) {
    this.walkonQueue.push(data);
    if (!this.isWalkonAnimating) this.processWalkonQueue();
  }

  async processWalkonQueue() {
    if (this.walkonQueue.length === 0) {
      this.isWalkonAnimating = false;
      if (this.config.previewMode && this.dom.walkonContainer) { await this.wait(250); this.dom.walkonContainer.classList.add('animate-in'); }
      return;
    }
    this.isWalkonAnimating = true;
    const current = this.walkonQueue.shift();
    await this.playWalkOn(current);
    this.processWalkonQueue();
  }

  async playWalkOn(raw) {
    this.lastWalkonData = raw;
    if (this.dom.walkonContainer && this.dom.walkonContainer.classList.contains('animate-in')) {
      this.dom.walkonContainer.classList.remove('animate-in');
      await this.wait(450);
    }

    if (!this.dom.walkonContainer) return;

    const userName = this.getField(raw, 'userName', ['user', 'targetUser', 'displayName']) || 'ViceCityLegend';
    const avatarUrl = this.getField(raw, this.config.varAvatar, ['avatarUrl', 'userProfileUrl', 'avatar']) || DEFAULT_AVATAR_SVG;
    const levelName = this.getField(raw, this.config.varTier, ['levelName', 'tier', 'role']) || 'VIP Member';

    if (this.dom.avatar) this.dom.avatar.src = avatarUrl;
    if (this.dom.username) this.dom.username.textContent = userName;
    if (this.dom.tier) this.dom.tier.textContent = String(levelName).toUpperCase();
    
    this.renderStatRows(raw);
    
    if (this.dom.avatarWrap) {
      this.dom.avatarWrap.className = 'avatar-wrapper ' + this.config.avatarAnim;
    }

    void this.dom.walkonContainer.offsetWidth;
    this.dom.walkonContainer.classList.add('animate-in');
    await this.wait(this.config.duration);
    this.dom.walkonContainer.classList.remove('animate-in');
    await this.wait(650);
  }

  // =====================================
  // MODULE 2: ALERTS PLAYBACK
  // =====================================
  enqueueAlert(data) {
    const t = data.alertType || 'generic';
    if (t !== 'generic' && this.config.alertsConfig[t] === false) return;
    
    this.alertQueue.push(data);
    if (!this.isAlertAnimating) this.processAlertQueue();
  }

  async processAlertQueue() {
    if (this.alertQueue.length === 0) {
      this.isAlertAnimating = false;
      if (this.config.previewMode && this.dom.alertContainer) { 
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
    if (this.dom.alertContainer && this.dom.alertContainer.classList.contains('animate-in')) {
      this.dom.alertContainer.classList.remove('animate-in');
      await this.wait(450);
    }
    
    if (!this.dom.alertContainer) return;

    const type = raw.alertType || 'sub';
    this.lastAlertType = type;
    this.dom.alertBox.className = `alert-box alert-${type}`;
    this.applyAlertAccentColor(type);

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
    
    const alertAv = document.getElementById('alert-avatar');
    if (alertAv) alertAv.src = avatarUrl;

    const bodyEl = document.getElementById('alert-body');
    bodyEl.innerHTML = '';

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

    bodyEl.style.display = bodyEl.innerHTML === '' ? 'none' : 'flex';

    void this.dom.alertContainer.offsetWidth; 
    this.dom.alertContainer.classList.add('animate-in');
    
    await this.wait(this.config.alertDuration);
    this.dom.alertContainer.classList.remove('animate-in');
    await this.wait(600);
  }

  // =====================================
  // MODULE 3: SHOUTOUT TOAST PLAYBACK
  // =====================================
  enqueueShoutout(data) {
    if (data && data.timestamp && data.timestamp === this.lastShoutoutTs) return;
    if (data && data.timestamp) this.lastShoutoutTs = data.timestamp;

    this.shoutoutQueue.push(data);
    if (!this.isShoutoutAnimating) this.processShoutoutQueue();
  }

  async processShoutoutQueue() {
    if (this.shoutoutQueue.length === 0) {
      this.isShoutoutAnimating = false;
      if (this.config.previewMode && this.dom.shoutoutContainer) {
        await this.wait(250);
        this.dom.shoutoutContainer.classList.remove('animate-out');
        this.dom.shoutoutContainer.classList.add('animate-in');
      }
      return;
    }
    this.isShoutoutAnimating = true;
    const current = this.shoutoutQueue.shift();
    await this.playShoutout(current);
    this.processShoutoutQueue();
  }

  async playShoutout(raw) {
    if (!this.dom.shoutoutContainer) return;

    if (this.dom.shoutoutContainer.classList.contains('animate-in')) {
      this.dom.shoutoutContainer.classList.remove('animate-in');
      this.dom.shoutoutContainer.classList.add('animate-out');
      await this.wait(450);
    }

    const userName = this.getField(raw, 'user', ['userName', 'targetUser', 'displayName']) || 'LEONIDA_CREATOR';
    const avatarUrl = this.getField(raw, 'avatar', ['avatarUrl', 'userProfileUrl']) || DEFAULT_AVATAR_SVG;

    this.applyShoutoutAccentColor();
    if (this.dom.shoutoutTitle) {
      this.dom.shoutoutTitle.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${this.config.soTitle || 'SHOUTOUT'}`;
    }
    if (this.dom.shoutoutName) {
      this.dom.shoutoutName.textContent = String(userName).toUpperCase();
    }
    if (this.dom.shoutoutAvatar) {
      this.dom.shoutoutAvatar.src = avatarUrl;
    }

    this.dom.shoutoutContainer.classList.remove('animate-out', 'animate-in');
    void this.dom.shoutoutContainer.offsetWidth;
    this.dom.shoutoutContainer.classList.add('animate-in');

    await this.wait(this.config.soDuration);

    this.dom.shoutoutContainer.classList.remove('animate-in');
    this.dom.shoutoutContainer.classList.add('animate-out');

    await this.wait(650);
  }

  // =====================================
  // MODULE 4: HORIZONTAL CHAT ENGINE
  // =====================================
  seedPreviewChatMessages() {
    const samples = [
      { userName: 'Lucia_Caminos', message: 'Vice City nights hit different!', role: 'member', avatar: 'https://i.pravatar.cc/120?img=47' },
      { userName: 'Jason_Leonida', message: 'Welcome everyone to the stream!', role: 'mod', avatar: 'https://i.pravatar.cc/120?img=12' },
      { userName: 'TommyV_86', message: 'Let\'s gooo!! Hype in the chat!', role: 'viewer', avatar: 'https://i.pravatar.cc/120?img=68' }
    ];
    samples.forEach(s => this.appendChatDomItem(s));
  }

  handleYouTubeChatEvent(d) {
    if (!d) return;
    const u = d.user || {};
    const userName = u.name || d.userName || d.user || 'YouTube User';
    const userId = u.id || d.userId || '';
    const message = d.message || d.rawInput || '';
    const isMod = Boolean(u.isModerator || u.isOwner || d.isModerator || d.isOwner);
    const isMember = Boolean(u.isSponsor || u.isMember || d.isSponsor || d.isMember);
    const groups = d.userGroups || u.groups || [];
    const emotes = d.emotes || [];
    const avatar = u.profileImageUrl || d.userProfileUrl || '';
    const msgId = d.eventId || d.messageId || `yt-${Date.now()}`;

    this.handleIncomingChatMessage({
      userName,
      userId,
      message,
      role: isMod ? 'mod' : (isMember ? 'member' : 'viewer'),
      groups,
      emotes,
      avatar,
      msgId
    });
  }

  handleTwitchChatEvent(d) {
    if (!d) return;
    const userName = d.displayName || d.username || d.user || 'Twitch User';
    const userId = d.userId || d.user_id || '';
    const message = d.message || d.rawInput || '';
    const roleNum = parseInt(d.role || '1', 10);
    const isMod = Boolean(d.isModerator || roleNum >= 3);
    const isMember = Boolean(d.isSubscriber || d.isVip || roleNum === 2);
    const groups = d.userGroups || [];
    const emotes = d.emotes || [];
    const avatar = d.avatarUrl || d.userProfileUrl || '';
    const msgId = d.msgId || `tw-${Date.now()}`;

    this.handleIncomingChatMessage({
      userName,
      userId,
      message,
      role: isMod ? 'mod' : (isMember ? 'member' : 'viewer'),
      groups,
      emotes,
      avatar,
      msgId
    });
  }

  shouldFilterOutChatMessage(item) {
    const rawMsg = String(item.message || '').trim();
    if (!rawMsg) return true;

    // 1. Check Command Prefixes (!, #, /, etc.)
    if (this.config.chatIgnoreCmds) {
      const prefixes = (this.config.chatCmdPrefixes || '!, #, /')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      for (const prefix of prefixes) {
        if (rawMsg.startsWith(prefix)) return true;
      }
    }

    // 2. Check Ignored Users (by Name or Channel ID)
    const ignoredUsers = (this.config.chatIgnoreUsers || '')
      .split(',')
      .map(u => u.trim().toLowerCase())
      .filter(Boolean);
    if (ignoredUsers.length > 0) {
      const uNameLower = String(item.userName || '').trim().toLowerCase();
      const uIdLower = String(item.userId || '').trim().toLowerCase();
      if ((uNameLower && ignoredUsers.includes(uNameLower)) ||
          (uIdLower && ignoredUsers.includes(uIdLower))) {
        return true;
      }
    }

    // 3. Check Ignored Groups (by groupName)
    const ignoredGroups = (this.config.chatIgnoreGroups || '')
      .split(',')
      .map(g => g.trim().toLowerCase())
      .filter(Boolean);
    if (ignoredGroups.length > 0 && item.groups) {
      const userGroupsList = Array.isArray(item.groups)
        ? item.groups.map(g => String(g).trim().toLowerCase())
        : String(item.groups).split(',').map(g => g.trim().toLowerCase());
      for (const g of userGroupsList) {
        if (g && ignoredGroups.includes(g)) return true;
      }
    }

    return false;
  }

  sanitizeAndFormatChatMessage(text, emotes) {
    let safe = String(text || '');
    if (Array.isArray(emotes) && emotes.length > 0 && emotes[0].startIndex !== undefined) {
      const sorted = [...emotes].sort((a, b) => b.startIndex - a.startIndex);
      sorted.forEach(em => {
        const url = em.imageUrl || em.url;
        if (url) {
          const imgTag = `<img src="${url}" class="emote" alt="" />`;
          safe = safe.substring(0, em.startIndex) + imgTag + safe.substring(em.endIndex + 1);
        }
      });
      return safe;
    }
    return safe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  handleIncomingChatMessage(raw) {
    const normalized = {
      userName: raw.userName || raw.user || raw.displayName || 'Viewer',
      userId:   raw.userId || raw.id || '',
      message:  raw.message !== undefined ? raw.message : (raw.rawInput || ''),
      role:     raw.role || (raw.isModerator ? 'mod' : (raw.isSponsor || raw.isMember ? 'member' : 'viewer')),
      groups:   raw.groups || raw.userGroups || '',
      emotes:   raw.emotes || [],
      avatar:   raw.avatar || raw.userProfileUrl || raw.avatarUrl || '',
      msgId:    raw.msgId || raw.messageId || `msg-${Date.now()}-${++this.chatMsgCounter}`
    };

    if (this.shouldFilterOutChatMessage(normalized)) return;
    this.appendChatDomItem(normalized);
  }

  appendChatDomItem(item) {
    if (!this.dom.chatTrack) return;

    const el = document.createElement('div');
    el.className = 'chat-item';
    if (item.msgId) el.dataset.msgid = item.msgId;
    if (item.userId) el.dataset.sender = item.userId;

    let uName = String(item.userName || 'Viewer').trim();
    let msgText = String(item.message || '').trim();
    if (this.config.chatUppercase) {
      uName = uName.toUpperCase();
      msgText = msgText.toUpperCase();
    }

    const roleClass = item.role === 'mod' ? 'role-mod' : (item.role === 'member' ? 'role-member' : 'role-viewer');

    let avatarHtml = '';
    if (this.config.chatShowAvatars && item.avatar) {
      avatarHtml = `<img class="chat-avatar" src="${item.avatar}" alt="" onerror="this.style.display='none'" />`;
    }

    let badgeHtml = '';
    if (this.config.chatShowBadges) {
      if (item.role === 'mod') {
        badgeHtml = `<i class="fa-solid fa-wrench chat-badge-icon" style="color:var(--chat-color-mod)"></i>`;
      } else if (item.role === 'member') {
        badgeHtml = `<i class="fa-solid fa-crown chat-badge-icon" style="color:var(--chat-color-member)"></i>`;
      }
    }

    const formattedMsg = this.sanitizeAndFormatChatMessage(msgText, item.emotes);

    el.innerHTML = `
      ${avatarHtml}
      ${badgeHtml}
      <span class="chat-user ${roleClass}">${uName}:</span>
      <span class="chat-msg">${formattedMsg}</span>
      <span class="chat-sep">•</span>
    `;

    this.dom.chatTrack.appendChild(el);

    // Slide out oldest messages on the left when exceeding chatMaxMsgs
    const maxMsgs = Math.max(3, this.config.chatMaxMsgs || 15);
    while (this.dom.chatTrack.children.length > maxMsgs) {
      const oldest = this.dom.chatTrack.firstElementChild;
      if (oldest) oldest.remove();
    }

    // Optional auto-hide timer per message
    if (this.config.chatHideAfter > 0 && !this.config.previewMode) {
      setTimeout(() => {
        if (el.parentNode) {
          el.classList.add('removing');
          setTimeout(() => el.remove(), 350);
        }
      }, this.config.chatHideAfter * 1000);
    }
  }

  removeChatMessageById(msgId) {
    if (!this.dom.chatTrack) return;
    const target = this.dom.chatTrack.querySelector(`[data-msgid="${msgId}"]`);
    if (target) target.remove();
  }

  removeChatMessagesByUser(userId) {
    if (!this.dom.chatTrack) return;
    this.dom.chatTrack.querySelectorAll(`[data-sender="${userId}"]`).forEach(el => el.remove());
  }

  // =====================================
  // MODULE 5: Q&A / CHAT HIGHLIGHT PLAYBACK
  // =====================================
  enqueueQA(data) {
    if (data && data.timestamp && data.timestamp === this.lastQATs) return;
    if (data && data.timestamp) this.lastQATs = data.timestamp;

    this.qaQueue.push(data);
    if (!this.isQAAnimating) this.processQAQueue();
  }

  async processQAQueue() {
    if (this.qaQueue.length === 0) {
      this.isQAAnimating = false;
      if (this.config.previewMode && this.dom.qaContainer) {
        await this.wait(250);
        this.dom.qaContainer.classList.remove('animate-out');
        this.dom.qaContainer.classList.add('animate-in');
      }
      return;
    }
    this.isQAAnimating = true;
    const current = this.qaQueue.shift();
    await this.playQA(current);
    this.processQAQueue();
  }

  async playQA(raw) {
    if (!this.dom.qaContainer) return;

    if (this.dom.qaContainer.classList.contains('animate-in')) {
      this.dom.qaContainer.classList.remove('animate-in');
      this.dom.qaContainer.classList.add('animate-out');
      await this.wait(450);
    }

    const userName = this.getField(raw, 'user', ['userName', 'targetUser', 'displayName']) || 'LEONIDA_VIEWER';
    const message  = this.getField(raw, 'msg', ['message', 'rawInput', 'text']) || '';
    const avatarUrl = this.getField(raw, 'avatar', ['avatarUrl', 'userProfileUrl', 'profileImageUrl']) || DEFAULT_AVATAR_SVG;

    this.applyQAAccentColor();

    if (this.dom.qaUsername) {
      this.dom.qaUsername.textContent = String(userName).toUpperCase();
    }
    if (this.dom.qaMessage) {
      this.dom.qaMessage.textContent = message;
    }
    if (this.dom.qaAvatar) {
      this.dom.qaAvatar.src = avatarUrl;
    }
    if (this.dom.qaBadge) {
      this.dom.qaBadge.style.display = this.config.qaShowBadge ? 'inline-flex' : 'none';
      this.dom.qaBadge.innerHTML = `<i class="fa-solid fa-comments"></i> ${this.config.qaTitle || 'Q&A HIGHLIGHT'}`;
    }

    this.dom.qaContainer.classList.remove('animate-out', 'animate-in');
    void this.dom.qaContainer.offsetWidth;
    this.dom.qaContainer.classList.add('animate-in');

    await this.wait(this.config.qaDuration);

    this.dom.qaContainer.classList.remove('animate-in');
    this.dom.qaContainer.classList.add('animate-out');

    await this.wait(650);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gtaOverlay = new GTAOverlayEngine(GTAOverlayConfig);
});
