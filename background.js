/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — background.js (Service Worker)
   Manifest V3 Background Service Worker
   Handles parallel processing and message routing
   Educational & Security Auditing Tool
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── Active Scan Tracking ────────────────────────────────────────────
const activeScans = new Map();

// ── Installation Handler ────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[TrustWatch AI] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First install — set default storage
    chrome.storage.local.set({
      scanCount: 0,
      lastScanTime: null,
      settings: {
        autoScan: false,
        injectBadges: true,
        aiReports: true
      }
    });
  }
});

// ── Message Router ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'START_BACKGROUND_SCAN':
      handleBackgroundScan(message, sender)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Keep channel open

    case 'ABORT_SCAN':
      handleAbortScan(message.tabId);
      sendResponse({ success: true });
      break;

    case 'GET_SCAN_STATUS':
      const status = activeScans.get(message.tabId);
      sendResponse({ status: status || 'idle' });
      break;

    case 'INCREMENT_SCAN_COUNT':
      chrome.storage.local.get(['scanCount'], (data) => {
        chrome.storage.local.set({
          scanCount: (data.scanCount || 0) + 1,
          lastScanTime: Date.now()
        });
      });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }

  return false;
});

// ── Background Scan Handler ─────────────────────────────────────────
async function handleBackgroundScan(message, sender) {
  const tabId = message.tabId;

  if (activeScans.has(tabId)) {
    return { success: false, error: 'Scan already in progress for this tab' };
  }

  const controller = new AbortController();
  activeScans.set(tabId, { status: 'scanning', controller });

  try {
    // Inject content script if needed, then request scan
    const results = await chrome.tabs.sendMessage(tabId, {
      action: 'TRUSTWATCH_DEEP_SCAN'
    });

    activeScans.set(tabId, { status: 'complete', results });
    return { success: true, results };

  } catch (err) {
    activeScans.delete(tabId);
    throw err;
  }
}

// ── Abort Scan Handler ──────────────────────────────────────────────
function handleAbortScan(tabId) {
  const scan = activeScans.get(tabId);
  if (scan && scan.controller) {
    scan.controller.abort();
  }
  activeScans.delete(tabId);
  console.log(`[TrustWatch AI] Scan aborted for tab ${tabId}`);
}

// ── Tab Close Cleanup ───────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeScans.has(tabId)) {
    handleAbortScan(tabId);
  }
});

// ── Keep-Alive for Service Worker ───────────────────────────────────
// MV3 service workers can be terminated; this prevents premature death during scans
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just a heartbeat
    const activeScanCount = activeScans.size;
    if (activeScanCount > 0) {
      console.log(`[TrustWatch AI] ${activeScanCount} active scan(s)`);
    }
  }
});

console.log('[TrustWatch AI] Background service worker initialized.');
