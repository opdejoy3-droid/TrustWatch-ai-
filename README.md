# 🛡️ TrustWatch AI — Cyber-Forensic Fraud Detector

<div align="center">

**The most advanced, open-source, privacy-first Manifest V3 browser extension for detecting online fraud, scam patterns, and dark UX traps.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](#)
[![AI Powered](https://img.shields.io/badge/AI-GPT--OSS--120B-purple.svg)](#)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen.svg)](#)

*Educational & Security Auditing Tool*

</div>

---

## 🌟 Overview

TrustWatch AI is a next-generation browser extension that combines **deep DOM forensics**, **heuristic pattern detection**, and **AI-powered analysis** to protect users from online fraud, scams, and manipulative dark patterns.

Built with a stunning **Pure Pearl Glassmorphism** aesthetic featuring 3D CSS animations, liquid-fill progress bars, and a victory confetti system — TrustWatch AI doesn't just protect you, it does it in style.

---

## ✨ Key Features

### 🔍 Deep DOM Forensics
| Detection Type | Description |
|---|---|
| **Invisible Text** | Detects text with color matching background (hidden T&C) |
| **Z-Index Hijacking** | Finds high-z-index overlays that intercept clicks |
| **Fake Urgency** | Regex engine for "Only 2 left!", "Price rising!" patterns |
| **Insecure Forms** | Flags HTTP form submissions on HTTPS pages |
| **Excessive Tracking** | Counts external scripts exceeding threshold |

### 🧠 AI-Powered Analysis
- **Model**: GPT-OSS-120B via Groq API (llama-3.3-70b-versatile)
- **System Prompt**: Elite Cyber-Lawyer mode for fraud identification
- **Context Optimization**: Prioritizes text containing "Privacy", "Refund", "Subscription", "Charge"
- **Structured Reports**: Risk Level, Trust Score (0-100), Top 3 Hidden Traps, Final Verdict

### 💎 Visual Grandeur
- **3D Crystal Shield** header with CSS `preserve-3d` rotation on all axes
- **3D Radar Scanner HUD** with sweep animation around the Analyze button
- **Liquid-fill Progress Bar** with wave animation
- **Animated Trust Score Gauge** with SVG ring
- **3D Golden Victory Trophy** with confetti explosion for 100% safe sites
- **Pure Pearl Glassmorphism** panels with backdrop-filter blur
- All animations at **60fps** using `will-change` hardware acceleration

### 🛡️ On-Page Protection
- Floating **🛡️ fraud badges** injected next to detected scam elements
- **3D hover tooltips** explaining each trap
- Real-time visual alerts on the page you're browsing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 POPUP UI                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
│  │ 3D Shield│  │  Radar   │  │  Score     │ │
│  │ Header   │  │  Scanner │  │  Gauge     │ │
│  └─────────┘  └──────────┘  └────────────┘ │
│  popup.html + styles.css + popup.js         │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────▼─────────┐
    │  Background Worker │  ← AbortController
    │  background.js     │  ← Message Router
    └─────────┬─────────┘
              │
   ┌──────────▼──────────┐   ┌────────────────┐
   │   Content Script     │   │   AI Engine     │
   │   content.js         │   │   ai_logic.js   │
   │   + DOM Scanner      │   │   + Groq API    │
   │   + Badge Injector   │   │   + Key Obfusc. │
   └──────────────────────┘   └────────────────┘
```

### State Machine Flow
```
BOOTING → IDLE → SCRAPING_DOM → AI_PROCESSING → 3D_REVEAL_SUCCESS
                                                        ↓
                                                   [if score ≥ 95]
                                                   TROPHY + CONFETTI
```

---

## 📦 File Structure

```
trustwatch-ai/
├── manifest.json           # Manifest V3 configuration
├── popup.html              # UI skeleton with 3D containers
├── styles.css              # 900+ lines of CSS (glassmorphism, 3D, motion)
├── popup.js                # State machine controller & UI engine
├── ai_logic.js             # AI integration with obfuscated API key
├── content.js              # DOM scraper & on-page badge injector
├── content_inject.css      # Injected styles for fraud badges
├── background.js           # Service worker for parallel processing
├── libs/
│   └── canvas-confetti.min.js  # Confetti particle library (MIT)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               # This file
```

---

## 🚀 Installation

### Chrome / Edge / Brave
1. Download or clone this repository
2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer Mode** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the `trustwatch-ai` folder
6. Click the TrustWatch AI icon in your toolbar to start scanning!

---

## 🔧 Configuration

### API Key
The extension uses the Groq API for AI analysis. The API key is obfuscated using multi-layer Base64 + XOR encryption inside `ai_logic.js`.

> ⚠️ **Security Note**: In production, API keys should NEVER be stored in client-side code. This implementation is for **educational and demonstration purposes only**. For production use, implement a backend proxy.

### Content Security Policy
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; connect-src https://api.groq.com https://*.groq.com;"
}
```

---

## 🎮 Usage

1. **Navigate** to any website you want to analyze
2. **Click** the TrustWatch AI icon in your toolbar
3. **Press** the "DEEP SCAN" button
4. **Watch** the 3D radar animation as DOM is harvested
5. **Review** the findings panel and AI forensic report
6. If the site is 100% safe — enjoy the **🏆 Trophy & Confetti** celebration!

---

## 🔬 Detection Methodology

### DOM Forensics (Heuristic Engine)
- **TreeWalker API** for efficient DOM traversal
- **Computed Style Analysis** for invisible text detection
- **RegExp Pattern Matching** against urgency manipulation database
- **Form Security Audit** checking protocol mismatches
- **Script Enumeration** for tracking analysis

### AI Analysis (GPT-OSS-120B)
- **Structured System Prompt** enforcing consistent report format
- **Priority Text Extraction** focusing on policy-related content
- **Context Window Optimization** (4000 char limit for efficiency)
- **AbortController Integration** to cancel requests when popup closes

---

## ⚡ Performance

- All 3D animations use `will-change: transform` for GPU compositing
- CSS animations run on compositor thread (no layout/paint)
- DOM scanning uses `TreeWalker` (50x faster than `querySelectorAll` loops)
- AI context is capped at 4000 chars to minimize latency
- Service Worker uses `AbortController` to prevent orphaned API calls

---

## 📜 License

MIT License — Free for educational and security research purposes.

---

## ⚠️ Disclaimer

This extension is designed for **Educational & Security Auditing** purposes. It is intended to help users understand web security threats and dark pattern techniques. The developers are not responsible for any misuse of this tool.

---

<div align="center">

**Built with ❤️ for a safer internet**

TrustWatch AI v1.0.0 • Open Source • Privacy First

</div>
