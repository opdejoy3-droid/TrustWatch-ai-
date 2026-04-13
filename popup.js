/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — popup.js
   Core Controller: State Machine, 3D Triggers, Motion & UI Updates
   Educational & Security Auditing Tool
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── State Machine Definition ────────────────────────────────────────
const STATE = Object.freeze({
  BOOTING: 'BOOTING',
  IDLE: 'IDLE',
  SCRAPING_DOM: 'SCRAPING_DOM',
  AI_PROCESSING: 'AI_PROCESSING',
  REVEAL_SUCCESS: '3D_REVEAL_SUCCESS',
  ERROR: 'ERROR'
});

class TrustWatchApp {
  constructor() {
    this.state = STATE.BOOTING;
    this.currentTabId = null;
    this.currentUrl = '';
    this.domFindings = [];
    this.aiReport = '';
    this.trustScore = 0;
    this.riskLevel = 'Pending';
    this.abortController = null;

    // DOM Cache
    this.elements = {};
    this._cacheElements();
    this._bindEvents();
    this._boot();
  }

  // ── Cache DOM elements ──────────────────────────────────────────
  _cacheElements() {
    const ids = [
      'headerStatus', 'statusDot', 'statusText',
      'siteInfoPanel', 'urlProtocol', 'urlDomain',
      'sslChip', 'domainAgeChip', 'domainAgeText',
      'scannerSection', 'radarContainer', 'analyzeBtn', 'analyzeBtnText',
      'progressSection', 'progressFill', 'progressLabel', 'progressPercent',
      'step1', 'step2', 'step3', 'step4',
      'scoreSection', 'scoreRingFill', 'scoreValue', 'scoreLabel',
      'gradStop1', 'gradStop2',
      'riskBadge', 'riskIcon', 'riskText',
      'findingsSection', 'findingsCount', 'findingsList',
      'reportSection', 'reportContent',
      'confettiCanvas'
    ];
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  // ── Bind Events ─────────────────────────────────────────────────
  _bindEvents() {
    this.elements.analyzeBtn.addEventListener('click', () => this._startScan());
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.location.href = 'auth.html?action=logout';
      });
    }
  }

  // ── Boot Sequence ───────────────────────────────────────────────
  async _boot() {
    this._setStatus('Booting...', 'scanning');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        this.currentTabId = tab.id;
        this.currentUrl = tab.url;
        this._displaySiteInfo(tab.url);
      } else {
        this._displaySiteInfo('');
      }
      this._transition(STATE.IDLE);
      this._setStatus('System Ready', '');
    } catch (err) {
      console.error('[TrustWatch] Boot error:', err);
      this._setStatus('Ready (limited)', '');
      this._transition(STATE.IDLE);
    }
  }

  // ── Display Current Site Info ───────────────────────────────────
  _displaySiteInfo(url) {
    try {
      if (!url || url.startsWith('chrome://') || url.startsWith('edge://')) {
        this.elements.urlProtocol.textContent = '';
        this.elements.urlDomain.textContent = 'Browser internal page';
        this.elements.sslChip.classList.add('insecure');
        return;
      }
      const parsed = new URL(url);
      const isSecure = parsed.protocol === 'https:';
      this.elements.urlProtocol.textContent = parsed.protocol + '//';
      this.elements.urlDomain.textContent = parsed.hostname;
      this.elements.sslChip.classList.toggle('secure', isSecure);
      this.elements.sslChip.classList.toggle('insecure', !isSecure);
      this.elements.sslChip.querySelector('.chip-text').textContent = isSecure ? 'SSL Secure' : 'No SSL';
      this.elements.sslChip.querySelector('.chip-icon').textContent = isSecure ? '🔒' : '🔓';
      this.elements.domainAgeText.textContent = parsed.hostname.length > 20 ? 'Long domain' : 'Domain OK';
    } catch (e) {
      this.elements.urlDomain.textContent = 'Unknown';
    }
  }

  // ── State Transition Engine ─────────────────────────────────────
  _transition(newState) {
    const prev = this.state;
    this.state = newState;
    console.log(`[TrustWatch] ${prev} → ${newState}`);
    this._updateUI();
  }

  // ── UI Updater (per state) ──────────────────────────────────────
  _updateUI() {
    switch (this.state) {
      case STATE.IDLE:
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.classList.remove('scanning');
        this.elements.analyzeBtnText.textContent = 'DEEP SCAN';
        break;
      case STATE.SCRAPING_DOM:
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.classList.add('scanning');
        this.elements.analyzeBtnText.textContent = 'SCANNING...';
        break;
      case STATE.AI_PROCESSING:
        this.elements.analyzeBtnText.textContent = 'AI ANALYZING...';
        break;
      case STATE.REVEAL_SUCCESS:
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.classList.remove('scanning');
        this.elements.analyzeBtnText.textContent = 'SCAN AGAIN';
        break;
      case STATE.ERROR:
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.classList.remove('scanning');
        this.elements.analyzeBtnText.textContent = 'RETRY SCAN';
        break;
    }
  }

  // ── Status Indicator ────────────────────────────────────────────
  _setStatus(text, dotClass) {
    this.elements.statusText.textContent = text;
    this.elements.statusDot.className = 'status-dot';
    if (dotClass) this.elements.statusDot.classList.add(dotClass);
  }

  // ── Progress Bar Control ────────────────────────────────────────
  _showProgress() {
    this.elements.progressSection.style.display = '';
    this._setProgress(0, 'Initializing...');
  }

  _setProgress(percent, label) {
    this.elements.progressFill.style.width = percent + '%';
    this.elements.progressPercent.textContent = percent + '%';
    if (label) this.elements.progressLabel.textContent = label;
  }

  _setStepActive(stepNum) {
    for (let i = 1; i <= 4; i++) {
      const el = this.elements['step' + i];
      el.classList.remove('active', 'done');
      if (i < stepNum) el.classList.add('done');
      if (i === stepNum) el.classList.add('active');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN SCAN PIPELINE
  // ══════════════════════════════════════════════════════════════════
  async _startScan() {
    if (this.state === STATE.SCRAPING_DOM || this.state === STATE.AI_PROCESSING) return;

    // Block scanning on internal browser pages
    if (!this.currentUrl || this.currentUrl.startsWith('chrome://') || this.currentUrl.startsWith('edge://') || this.currentUrl.startsWith('about:') || this.currentUrl.startsWith('chrome-extension://')) {
      this._setStatus('Cannot scan browser pages', 'warning');
      return;
    }

    // Reset UI
    this.domFindings = [];
    this.aiReport = '';
    this.trustScore = 0;
    this.elements.scoreSection.style.display = 'none';
    this.elements.findingsSection.style.display = 'none';
    this.elements.reportSection.style.display = 'none';
    this.elements.findingsList.innerHTML = '';
    this.elements.reportContent.innerHTML = '';

    // Create AbortController for this scan
    this.abortController = new AbortController();

    this._showProgress();
    this._transition(STATE.SCRAPING_DOM);
    this._setStatus('Harvesting DOM...', 'scanning');

    try {
      // ── Step 1: DOM Scraping ──────────────────────────────────
      this._setStepActive(1);
      this._setProgress(15, 'Injecting content scanner...');
      await this._sleep(400);

      const domData = await this._scrapeDom();
      this._setProgress(35, 'DOM harvested');
      await this._sleep(300);

      // ── Step 2: Heuristic Pattern Detection ───────────────────
      this._setStepActive(2);
      this._setProgress(45, 'Running heuristic detection...');
      this._setStatus('Pattern Detection...', 'scanning');

      this.domFindings = domData.findings || [];
      this._renderFindings(this.domFindings);
      this._setProgress(55, `Found ${this.domFindings.length} patterns`);
      await this._sleep(400);

      // ── Step 3: AI Forensic Analysis ──────────────────────────
      this._setStepActive(3);
      this._setProgress(60, 'Sending to AI engine...');
      this._transition(STATE.AI_PROCESSING);
      this._setStatus('AI Forensics...', 'scanning');

      const aiResult = await this._runAiAnalysis(domData.pageText, domData.findings, this.abortController.signal);
      this._setProgress(90, 'AI report received');
      await this._sleep(300);

      // ── Step 4: Verdict & 3D Reveal ───────────────────────────
      this._setStepActive(4);
      this._setProgress(100, 'Generating verdict...');
      this._setStatus('Finalizing...', 'scanning');
      await this._sleep(400);

      this._displayResults(aiResult);
      this._transition(STATE.REVEAL_SUCCESS);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[TrustWatch] Scan aborted.');
        this._setStatus('Scan Cancelled', 'warning');
      } else {
        console.error('[TrustWatch] Scan error:', err);
        this._setStatus('Scan Failed', 'danger');
        this._setProgress(0, 'Error: ' + (err.message || 'Unknown'));
      }
      this._transition(STATE.ERROR);
    }
  }

  // ── DOM Scraping via Content Script ─────────────────────────────
  async _scrapeDom() {
    if (!this.currentTabId) {
      throw new Error('No active tab found');
    }

    // ── Strategy 1: Message the manifest-injected content script ──
    // content.js is auto-injected via manifest.json and has full page access
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          this.currentTabId,
          { action: 'TRUSTWATCH_DEEP_SCAN' },
          (resp) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(resp);
          }
        );
      });

      if (response && response.success && response.pageText) {
        console.log('[TrustWatch] Content script responded successfully.');
        // Normalize findings: content.js uses 'desc', inline uses 'description'
        const normalizedFindings = (response.findings || []).map(f => ({
          type: f.type,
          severity: f.severity || 'medium',
          title: f.title,
          description: f.desc || f.description || f.text || '',
          element: f.element || 'DOM'
        }));
        return { pageText: response.pageText, findings: normalizedFindings };
      }
    } catch (e) {
      if (!e.message.includes('Receiving end does not exist')) {
        console.warn('[TrustWatch] Content script message failed:', e.message);
      } else {
        console.log('[TrustWatch] Content script not present, falling back to inline injection...');
      }
    }

    // ── Strategy 2: Fallback — inject and execute inline function ──
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId },
        func: TrustWatchApp._contentScrapeFn
      });

      if (results && results[0] && results[0].result) {
        console.log('[TrustWatch] Inline executeScript succeeded.');
        return results[0].result;
      }
    } catch (e) {
      console.warn('[TrustWatch] executeScript also failed:', e.message);
    }

    // ── Strategy 3: Last resort — try to get just the page title/URL ──
    console.warn('[TrustWatch] All scraping failed, using minimal fallback.');
    return {
      pageText: `Page URL: ${this.currentUrl}\nNote: Full content could not be extracted. Please analyze based on URL and domain reputation.`,
      findings: []
    };
  }

  // ── Content Script Function (injected) ──────────────────────────
  static _contentScrapeFn() {
    const findings = [];
    const body = document.body;
    if (!body) return { pageText: '', findings: [] };

    // ─ 1. Invisible Text Detection ─
    const allElements = body.querySelectorAll('*');
    allElements.forEach(el => {
      try {
        const style = getComputedStyle(el);
        const text = el.textContent?.trim();
        if (!text || text.length < 5) return;

        // Same color as background
        if (style.color === style.backgroundColor && text.length > 10) {
          findings.push({
            type: 'invisible_text',
            severity: 'medium',
            title: 'Hidden Invisible Text / Accessibility',
            description: `Text color matches background (often accessibility, sometimes hides fine print): "${text.substring(0, 80)}..."`,
            element: el.tagName
          });
        }

        // Very low opacity
        if (parseFloat(style.opacity) < 0.1 && text.length > 20) {
          findings.push({
            type: 'invisible_text',
            severity: 'medium',
            title: 'Near-Invisible Element / Accessibility',
            description: `Element with opacity ${style.opacity} (often used for screen readers): "${text.substring(0, 60)}..."`,
            element: el.tagName
          });
        }

        // Ultra-small text
        if (parseFloat(style.fontSize) < 6 && text.length > 15) {
          findings.push({
            type: 'invisible_text',
            severity: 'medium',
            title: 'Micro Text Detected',
            description: `Very small text (${style.fontSize}): "${text.substring(0, 60)}..."`,
            element: el.tagName
          });
        }
      } catch (e) { /* skip inaccessible elements */ }
    });

    // ─ 2. Z-Index Hijacking / Hidden Overlays ─
    allElements.forEach(el => {
      try {
        const style = getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex > 9000 && style.position !== 'static') {
          const rect = el.getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
            findings.push({
              type: 'zindex_hijack',
              severity: 'critical',
              title: 'Z-Index Overlay Hijacking',
              description: `High z-index (${zIndex}) overlay detected covering ${Math.round(rect.width)}x${Math.round(rect.height)}px — may track clicks.`,
              element: el.tagName
            });
          }
        }
      } catch (e) {}
    });

    // ─ 3. Fake Urgency Pattern Detection ─
    const urgencyPatterns = [
      /only \d+ (?:minutes?|hours?|seconds?|items?|left)/gi,
      /(?:demand|price|offer) (?:is|will) (?:high|rise|expire|end)/gi,
      /limited (?:time|stock|offer|availability)/gi,
      /act (?:now|fast|quickly|immediately)/gi,
      /(?:hurry|rush|don'?t (?:miss|wait))/gi,
      /(?:price (?:goes|will go) up|increasing soon)/gi,
      /\d+ people (?:are )?(?:viewing|watching|buying)/gi,
      /(?:last chance|final offer|ending soon|expires in)/gi,
      /(?:today only|one-time offer|exclusive deal)/gi
    ];

    const bodyText = body.innerText || '';
    urgencyPatterns.forEach(pattern => {
      const matches = bodyText.match(pattern);
      if (matches) {
        matches.slice(0, 3).forEach(match => {
          findings.push({
            type: 'fake_urgency',
            severity: 'medium',
            title: 'Fake Urgency Pattern',
            description: `Urgency manipulation detected: "${match}"`,
            element: 'BODY'
          });
        });
      }
    });

    // ─ 4. Suspicious Form Fields ─
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const action = form.getAttribute('action') || '';
      if (action.startsWith('http:') && window.location.protocol === 'https:') {
        findings.push({
          type: 'insecure_form',
          severity: 'critical',
          title: 'Insecure Form Submission',
          description: `Form submits data over HTTP (insecure): ${action.substring(0, 60)}`,
          element: 'FORM'
        });
      }
    });

    // ─ 5. External Script Analysis ─
    const scripts = document.querySelectorAll('script[src]');
    let externalScriptCount = 0;
    scripts.forEach(s => {
      try {
        const src = new URL(s.src, window.location.href);
        if (src.hostname !== window.location.hostname) externalScriptCount++;
      } catch (e) {}
    });
    if (externalScriptCount > 15) {
      findings.push({
        type: 'excessive_tracking',
        severity: 'medium',
        title: 'Excessive External Scripts',
        description: `${externalScriptCount} external scripts loaded — possible heavy tracking.`,
        element: 'HEAD'
      });
    }

    // ── Priority text extraction for AI ──
    const priorityKeywords = ['privacy', 'refund', 'subscription', 'charge', 'cancel', 'auto-renew', 'billing', 'trial', 'fee', 'payment', 'data', 'terms', 'conditions', 'agreement', 'consent', 'cookie', 'track', 'review', 'rating', 'star', 'verified purchase'];
    let priorityText = '';
    const paragraphs = document.querySelectorAll('p, li, span, div, td, a, label, h1, h2, h3, h4, h5, h6');
    paragraphs.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 10) {
        const lowerText = text.toLowerCase();
        if (priorityKeywords.some(kw => lowerText.includes(kw))) {
          priorityText += text + '\n';
        }
      }
    });

    // Cap at 4000 chars for AI context
    const generalText = bodyText.substring(0, 2000);
    const pageText = (priorityText.substring(0, 2000) + '\n---\n' + generalText).substring(0, 4000);

    return { pageText, findings };
  }

  async _runAiAnalysis(pageText, findings, signal) {
    const findingsSummary = findings.map(f =>
      `[${f.severity.toUpperCase()}] ${f.title}: ${f.description}`
    ).join('\n');

    const contextForAI = `
=== TARGET URL ===
${this.currentUrl}

=== PAGE TEXT (Priority Excerpts) ===
${pageText}

=== DOM FORENSIC FINDINGS ===
${findingsSummary || 'No DOM anomalies detected.'}
    `.trim();

    try {
      const result = await TrustWatchAI.analyze(contextForAI, signal);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.error('[TrustWatch] AI Error:', err);
      return {
        report: 'AI analysis could not be completed. Error: ' + err.message,
        riskLevel: 'Medium',
        score: 50
      };
    }
  }

  // ── Render Findings ─────────────────────────────────────────────
  _renderFindings(findings) {
    this.elements.findingsSection.style.display = '';
    this.elements.findingsCount.textContent = findings.length;
    this.elements.findingsCount.className = 'findings-count' + (findings.length === 0 ? ' clean' : '');

    if (findings.length === 0) {
      this.elements.findingsList.innerHTML = `
        <div class="finding-item info" style="border-left-color: var(--tw-safe-green);">
          <span class="finding-type-icon">✅</span>
          <div class="finding-details">
            <div class="finding-title">Clean Scan</div>
            <div class="finding-desc">No suspicious DOM patterns detected on this page.</div>
          </div>
        </div>
      `;
      return;
    }

    const iconMap = {
      invisible_text: '👻',
      zindex_hijack: '🕵️',
      fake_urgency: '⏰',
      insecure_form: '🔓',
      excessive_tracking: '📡'
    };

    this.elements.findingsList.innerHTML = findings.map((f, i) => `
      <div class="finding-item ${f.severity === 'critical' ? '' : 'warn'}" style="animation-delay: ${i * 80}ms">
        <span class="finding-type-icon">${iconMap[f.type] || '⚠️'}</span>
        <div class="finding-details">
          <div class="finding-title">${this._escapeHtml(f.title)}</div>
          <div class="finding-desc">${this._escapeHtml(f.description)}</div>
        </div>
      </div>
    `).join('');
  }

  // ── Display Final Results ───────────────────────────────────────
  _displayResults(aiResult) {
    // Show score
    this.elements.scoreSection.style.display = '';
    const score = Math.max(0, Math.min(100, aiResult.score || 50));
    this.trustScore = score;

    // Animate score ring (circumference = 2 * PI * 85 ≈ 534)
    const circumference = 534;
    const offset = circumference - (circumference * score / 100);
    this.elements.scoreRingFill.style.strokeDashoffset = offset;

    // Animate score number
    this._animateCounter(this.elements.scoreValue, 0, score, 1200);

    // Set colors based on risk
    const riskLevel = (aiResult.riskLevel || 'Medium').toLowerCase();
    if (riskLevel === 'low' || score >= 75) {
      this._setScoreColors('#10B981', '#34D399', 'safe');
      this.elements.riskIcon.textContent = '✅';
      this.elements.riskText.textContent = 'Low Risk — Appears Safe';
      this._setStatus('Site Verified', '');
    } else if (riskLevel === 'critical' || score < 40) {
      this._setScoreColors('#EF4444', '#F87171', 'critical');
      this.elements.riskIcon.textContent = '🚨';
      this.elements.riskText.textContent = 'CRITICAL — High Fraud Risk';
      this._setStatus('Danger Detected!', 'danger');
    } else {
      this._setScoreColors('#F59E0B', '#FBBF24', 'medium');
      this.elements.riskIcon.textContent = '⚠️';
      this.elements.riskText.textContent = 'Medium Risk — Exercise Caution';
      this._setStatus('Caution Advised', 'warning');
    }

    this.elements.riskBadge.className = 'risk-badge ' +
      (score >= 75 ? 'safe' : score < 40 ? 'critical' : 'medium');

    // Show AI report
    this.elements.reportSection.style.display = '';
    this.elements.reportContent.innerHTML = this._formatReport(aiResult.report || 'No report generated.');

    // 100% Safe → Trophy + Confetti
    if (score >= 95) {
      this._triggerVictory();
    }
  }

  _setScoreColors(color1, color2, className) {
    this.elements.gradStop1.setAttribute('stop-color', color1);
    this.elements.gradStop2.setAttribute('stop-color', color2);
  }

  _formatReport(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.*$)/gm, '<strong style="font-size:0.9rem;display:block;margin:8px 0 4px;">$1</strong>')
      .replace(/^## (.*$)/gm, '<strong style="font-size:1rem;display:block;margin:10px 0 4px;">$1</strong>')
      .replace(/^- (.*$)/gm, '• $1')
      .replace(/\n/g, '<br>')
      .replace(/Critical/gi, '<span class="risk-critical">Critical</span>')
      .replace(/Medium/gi, '<span class="risk-medium">Medium</span>')
      .replace(/Low Risk/gi, '<span class="risk-low">Low Risk</span>');
  }

  // ── Victory: Confetti ──────────────────────────────────
  _triggerVictory() {

    // Fire confetti using canvas-confetti library
    try {
      if (typeof confetti !== 'undefined' && typeof confetti.create === 'function') {
        const canvas = this.elements.confettiCanvas;
        if (canvas) {
          // Set canvas size to fill popup
          canvas.width = document.documentElement.clientWidth || 420;
          canvas.height = document.documentElement.clientHeight || 600;

          const myConfetti = confetti.create(canvas, { resize: true });

          // Burst 1 — center
          myConfetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#DAA520', '#10B981', '#3B82F6', '#8B5CF6']
          });

          // Burst 2 — left side
          setTimeout(() => {
            myConfetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#FFD700', '#FFA500', '#FF6347']
            });
          }, 300);

          // Burst 3 — right side
          setTimeout(() => {
            myConfetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#FFD700', '#00FF7F', '#87CEEB']
            });
          }, 500);
        }
      } else if (typeof confetti === 'function') {
        // Fallback: use global confetti directly
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#FFD700', '#DAA520', '#10B981'] });
      }
    } catch (e) {
      console.warn('[TrustWatch] Confetti error (non-critical):', e);
    }
  }

  // ── Animated Counter ────────────────────────────────────────────
  _animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.round(start + (end - start) * easedProgress);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ── Utilities ───────────────────────────────────────────────────
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ── Initialize on DOM Ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.trustwatchApp = new TrustWatchApp();
});
