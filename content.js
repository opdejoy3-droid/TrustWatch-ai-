/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — content.js
   Advanced DOM Scraper & On-Page Fraud Badge Injector
   Educational & Security Auditing Tool
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

(() => {
  // Prevent double-injection
  if (window.__trustwatch_injected) return;
  window.__trustwatch_injected = true;

  // ══════════════════════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════════════════════
  const BADGE_CLASS = 'trustwatch-fraud-badge';
  const TOOLTIP_CLASS = 'trustwatch-tooltip';

  // ══════════════════════════════════════════════════════════════════
  // URGENCY PATTERN DATABASE
  // ══════════════════════════════════════════════════════════════════
  const URGENCY_PATTERNS = [
    { regex: /only \d+ (?:minutes?|hours?|seconds?) left/gi, label: 'Time Pressure', desc: 'A countdown is present. Could be a genuine sale or an artificial pressure tactic.' },
    { regex: /(?:demand|price|offer) (?:is|will) (?:high|rise|expire|end)/gi, label: 'Price/Offer Pressure', desc: 'Claims that an offer or price will change. Can be standard marketing or manipulated urgency.' },
    { regex: /limited (?:time|stock|offer|availability)/gi, label: 'Scarcity/Promotion', desc: 'A "limited" claim was found. Often a genuine promotion, but can be a FOMO dark pattern if overused.' },
    { regex: /act (?:now|fast|quickly|immediately)/gi, label: 'Pressure Tactic', desc: 'Rushing the user is a classic manipulation technique.' },
    { regex: /(?:hurry|rush|don'?t (?:miss|wait))/gi, label: 'Urgency Language', desc: 'This language is designed to bypass rational decision-making.' },
    { regex: /\d+ people (?:are )?(?:viewing|watching|buying)/gi, label: 'Social Proof Manipulation', desc: 'These viewer/buyer counts are often fake or inflated.' },
    { regex: /(?:last chance|final offer|ending soon|expires? in)/gi, label: 'False Deadline', desc: 'These deadlines often reset — the offer is likely permanent.' },
    { regex: /(?:today only|one-time offer|exclusive deal)/gi, label: 'Exclusivity Fraud', desc: 'This "exclusive" deal is likely always available.' },
    { regex: /(?:almost gone|selling out fast|high demand)/gi, label: 'High Demand Claim', desc: 'Often used to create artificial scarcity without proof.' },
    { regex: /only \d+ (?:seats?|rooms?|items?) left/gi, label: 'Inventory Pressure', desc: 'Low stock warnings are a common FOMO manipulation.' }
  ];

  // ══════════════════════════════════════════════════════════════════
  // DEEP DOM SCANNER
  // ══════════════════════════════════════════════════════════════════
  function deepScan() {
    const findings = [];
    const MAX_FINDINGS = 15; // Strict cap to prevent UI/AI overflow on large sites
    const body = document.body;
    if (!body) return findings;

    const walker = document.createTreeWalker(
      body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const tag = node.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'svg', 'path', 'video', 'audio', 'canvas', 'iframe'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip obviously hidden container sections immediately
          if (node.getAttribute('aria-hidden') === 'true' || node.classList.contains('a-hidden')) {
            return NodeFilter.FILTER_REJECT; // Amazon specifically uses 'a-hidden' heavily
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      if (findings.length >= MAX_FINDINGS) break; // Stop scanning if we hit the cap

      try {
        checkInvisibleText(node, findings);
        if (findings.length >= MAX_FINDINGS) break;
        checkUrgencyPatterns(node, findings);
        if (findings.length >= MAX_FINDINGS) break;
        checkZIndexHijack(node, findings);
        if (findings.length >= MAX_FINDINGS) break;
        checkConfirmShaming(node, findings);
        if (findings.length >= MAX_FINDINGS) break;
        checkSneakIntoBasket(node, findings);
      } catch (e) { /* skip problematic nodes */ }
    }

    return findings;
  }

  // ── Invisible Text Detection ────────────────────────────────────
  function checkInvisibleText(el, findings) {
    const text = el.textContent?.trim();
    if (!text || text.length < 10) return;

    // Only check leaf-ish elements
    if (el.children.length > 3) return;

    // ─ Skip legitimate uses of hidden elements ─
    // Accessibility: screen-reader-only / aria-hidden elements are normal
    if (el.getAttribute('aria-hidden') === 'true') return;
    if (el.classList.contains('sr-only') || el.classList.contains('visually-hidden') || el.classList.contains('screen-reader-only') || el.classList.contains('a-offscreen') || el.classList.contains('offscreen')) return;

    // Lazy-loading / transition elements (common on Amazon, eBay, etc.)
    const role = el.getAttribute('role') || '';
    if (['img', 'presentation', 'none', 'status', 'log', 'alert'].includes(role)) return;

    // Skip elements inside <noscript>, <template>, or hidden containers
    if (el.closest('noscript, template, [aria-hidden="true"]')) return;

    const style = getComputedStyle(el);

    // Skip elements that are display:none or visibility:hidden (not suspicious, just hidden)
    if (style.display === 'none' || style.visibility === 'hidden') return;

    // Color matches background — but only for actual text content, not UI elements
    if (style.color === style.backgroundColor && text.length > 30) {
      // Skip if both are common defaults (rgb(0, 0, 0) on transparent, etc.)
      if (style.color !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        findings.push({
          element: el,
          type: 'invisible_text',
          title: 'Hidden Text Detected',
          desc: 'Text with color matching background — may contain hidden terms.',
          text: text.substring(0, 100)
        });
      }
    }

    // Clip-path or position absolute off-screen text
    if ((parseFloat(style.opacity) === 0 || style.clipPath === 'polygon(0px 0px, 0px 0px, 0px 0px, 0px 0px)' || parseInt(style.top) < -900 || parseInt(style.left) < -900) && text.length > 30) {
      findings.push({
        element: el,
        type: 'invisible_text',
        title: 'Off-Screen Text / Accessibility',
        desc: 'Text physically pushed off-screen. Often used for accessibility (screen readers), but can sometimes hide fine print.',
        text: text.substring(0, 100)
      });
    }
  }

  // ── Urgency Pattern Detection ───────────────────────────────────
  const _foundPatterns = new Set();
  function checkUrgencyPatterns(el, findings) {
    const text = el.textContent?.trim();
    if (!text || text.length < 8 || text.length > 500) return;
    // Only check text-heavy leaf elements
    if (el.children.length > 2) return;

    for (const pattern of URGENCY_PATTERNS) {
      if (_foundPatterns.has(pattern.label)) continue; // Only flag each tactic once per page

      const matches = text.match(pattern.regex);
      if (matches) {
        _foundPatterns.add(pattern.label);
        findings.push({
          element: el,
          type: 'fake_urgency',
          title: pattern.label,
          desc: pattern.desc,
          text: matches[0]
        });
        break; // One badge per element
      }
    }
  }

  // ── Z-Index Hijacking Detection ─────────────────────────────────
  function checkZIndexHijack(el, findings) {
    const style = getComputedStyle(el);
    const zIndex = parseInt(style.zIndex);

    if (isNaN(zIndex) || zIndex < 9000) return;
    if (style.position === 'static') return;

    const rect = el.getBoundingClientRect();
    if (rect.width > window.innerWidth * 0.4 && rect.height > window.innerHeight * 0.4) {
      findings.push({
        element: el,
        type: 'zindex_hijack',
        title: 'Overlay Click Hijack',
        desc: 'A high z-index overlay may be intercepting your clicks and tracking behavior.',
        text: `z-index: ${zIndex}, size: ${Math.round(rect.width)}×${Math.round(rect.height)}`
      });
    }
  }

  // ── Confirmshaming Detection ────────────────────────────────────
  const CONFIRMSHAMING_PATTERNS = [
    /(?:no thanks,? i (?:hate|don'?t like) (?:saving|money|discounts))/i,
    /(?:i prefer to pay full price)/i,
    /(?:i don'?t want to improve)/i,
    /(?:i'?ll pass,? i don'?t care about)/i
  ];

  function checkConfirmShaming(el, findings) {
    if (el.tagName !== 'A' && el.tagName !== 'BUTTON' && el.role !== 'button' && !el.classList.contains('btn')) return;
    
    const text = el.textContent?.trim();
    if (!text || text.length < 8 || text.length > 100) return;

    for (const pattern of CONFIRMSHAMING_PATTERNS) {
      if (pattern.test(text)) {
        findings.push({
          element: el,
          type: 'confirmshaming',
          title: 'Confirmshaming Detected',
          desc: 'This interface uses guilt or shame to pressure you into opting in.',
          text: text
        });
        break;
      }
    }
  }

  // ── Sneak into Basket / Traps ───────────────────────────────────
  function checkSneakIntoBasket(el, findings) {
    if (el.tagName !== 'INPUT' || el.type !== 'checkbox') return;
    if (!el.checked) return; // We only care about pre-checked boxes

    // Find label
    let labelText = '';
    const id = el.id;
    if (id) {
      const labelUser = document.querySelector(`label[for="${id}"]`);
      if (labelUser) labelText = labelUser.textContent;
    }
    if (!labelText) {
      const parentLabel = el.closest('label');
      if (parentLabel) labelText = parentLabel.textContent;
    }
    
    if (!labelText && el.nextElementSibling) {
      labelText = el.nextElementSibling.textContent;
    }

    if (!labelText) return;

    const lowerLabel = labelText.toLowerCase();
    const trapKeywords = ['subscribe', 'newsletter', 'insurance', 'protection', 'monthly', 'auto-renew', 'fee', 'donation', 'magazine'];

    for (const kw of trapKeywords) {
      if (lowerLabel.includes(kw)) {
        findings.push({
          element: el,
          type: 'sneak_into_basket',
          title: 'Sneak into Basket',
          desc: 'A checkbox for extra costs/subscriptions was pre-selected for you without your consent.',
          text: labelText.trim().substring(0, 100)
        });
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ON-PAGE BADGE INJECTOR
  // ══════════════════════════════════════════════════════════════════
  function injectBadges(findings) {
    // Remove old badges
    document.querySelectorAll('.' + BADGE_CLASS).forEach(b => b.remove());

    findings.forEach((finding, index) => {
      try {
        const el = finding.element;
        if (!el || !el.parentNode) return;

        // Don't badge body/html
        if (['BODY', 'HTML'].includes(el.tagName)) return;

        // Ensure parent is positioned
        const parentStyle = getComputedStyle(el.parentNode);
        if (parentStyle.position === 'static') {
          el.parentNode.style.position = 'relative';
        }

        // Create badge
        const badge = document.createElement('div');
        badge.className = BADGE_CLASS;
        badge.setAttribute('data-trustwatch-index', index);
        badge.innerHTML = '🛡️';
        badge.title = finding.title;

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = TOOLTIP_CLASS;
        tooltip.innerHTML = `
          <div class="trustwatch-tooltip-title">⚠️ ${escapeHtml(finding.title)}</div>
          <div class="trustwatch-tooltip-desc">${escapeHtml(finding.desc)}</div>
          <div class="trustwatch-tooltip-evidence">"${escapeHtml(finding.text?.substring(0, 80) || '')}"</div>
          <div class="trustwatch-tooltip-footer">🛡️ TrustWatch AI — Security Alert</div>
        `;

        badge.appendChild(tooltip);

        // Position badge near element
        el.parentNode.insertBefore(badge, el);

      } catch (e) {
        console.warn('[TrustWatch] Badge injection error:', e);
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════════════════════════
  // MESSAGE HANDLER (from popup / background)
  // ══════════════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TRUSTWATCH_DEEP_SCAN') {
      try {
        const findings = deepScan();
        injectBadges(findings);

        // Serialize findings (can't send DOM elements)
        const serialized = findings.map(f => ({
          type: f.type,
          title: f.title,
          desc: f.desc,
          text: f.text,
          severity: f.type === 'zindex_hijack' ? 'critical' : 'medium'
        }));

        // Extract priority text for AI analysis
        const priorityKeywords = ['privacy', 'refund', 'subscription', 'charge', 'cancel', 'auto-renew', 'billing', 'trial', 'fee', 'payment', 'data', 'terms', 'conditions', 'agreement', 'consent', 'cookie', 'track', 'review', 'rating', 'star', 'verified purchase'];
        let priorityText = '';
        
        // Ensure form context & labels are grabbed too (often hide the critical info)
        document.querySelectorAll('label').forEach(el => {
          priorityText += 'Label: ' + (el.textContent?.trim() || '') + '\n';
        });

        const textElements = document.querySelectorAll('p, li, span, div, td, a, label, h1, h2, h3, h4, h5, h6');
        textElements.forEach(el => {
          const t = el.textContent?.trim();
          if (t && t.length > 10 && el.children.length < 4) {
            const lower = t.toLowerCase();
            if (priorityKeywords.some(kw => lower.includes(kw))) {
              priorityText += t + '\n';
            }
          }
        });

        const bodyText = document.body.innerText || '';
        const generalText = bodyText.substring(0, 2000);
        const pageText = (priorityText.substring(0, 2000) + '\n---\n' + generalText).substring(0, 4000);

        sendResponse({ success: true, findings: serialized, pageText: pageText });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }

    if (message.action === 'TRUSTWATCH_CLEAR_BADGES') {
      document.querySelectorAll('.' + BADGE_CLASS).forEach(b => b.remove());
      sendResponse({ success: true });
    }

    return true; // keep channel open for async
  });

  console.log('[TrustWatch AI] Content script ready.');
})();
