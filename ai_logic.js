/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — ai_logic.js
   AI Engine: GPT-OSS-120B via Groq API Integration
   Multi-layer Base64 + XOR Key Obfuscation
   Educational & Security Auditing Tool
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const TrustWatchAI = (() => {

  // ══════════════════════════════════════════════════════════════════
  // OBFUSCATED API KEY STORAGE
  // Multi-layer: Base64 → XOR → Base64 → Reverse
  // This is for EDUCATIONAL DEMONSTRATION of key obfuscation techniques.
  // In production, NEVER store API keys in client-side code.
  // ══════════════════════════════════════════════════════════════════

  const _xorKey = 0x5A; // XOR cipher key

  function _xorCipher(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return result;
  }

  function _encode(plainKey) {
    // Layer 1: Base64
    const b64_1 = btoa(plainKey);
    // Layer 2: XOR
    const xored = _xorCipher(b64_1, _xorKey);
    // Layer 3: Base64 again
    const b64_2 = btoa(xored);
    // Layer 4: Reverse
    return b64_2.split('').reverse().join('');
  }

  function _decode(obfuscated) {
    // Reverse Layer 4
    const unreversed = obfuscated.split('').reverse().join('');
    // Reverse Layer 3: Base64 decode
    const xored = atob(unreversed);
    // Reverse Layer 2: XOR
    const b64_1 = _xorCipher(xored, _xorKey);
    // Reverse Layer 1: Base64 decode
    return atob(b64_1);
  }

  // IMPORTANT: For open-source security, DO NOT commit your real API key to GitHub.
  // To use this extension locally, replace 'YOUR_GROQ_API_KEY_HERE' with your actual Groq key.
  const _OBFUSCATED_KEY = _encode('YOUR_GROQ_API_KEY_HERE');

  function _getApiKey() {
    try {
      return _decode(_OBFUSCATED_KEY);
    } catch (e) {
      console.error('[TrustWatch AI] Key decode failure');
      return null;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // API CONFIGURATION
  // ══════════════════════════════════════════════════════════════════
  const API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL_ID = 'openai/gpt-oss-120b';

  // ══════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT — Elite Cyber-Lawyer Mode
  // ══════════════════════════════════════════════════════════════════
  const SYSTEM_PROMPT = `You are an elite consumer protection and cyber-forensics expert. Your job is to analyze website content and DOM forensic findings to identify fraud, scams, dark patterns, and user manipulation tactics.

Your analysis MUST follow this structure:

## 🔒 TrustWatch AI — Forensic Report

### Risk Level
State one of: **Critical** (active fraud/scam), **Medium** (suspicious patterns), or **Low Risk** (appears legitimate).

### Trust Score
Provide a numeric score from 0-100 where:
- 0-30: Active scam / severe fraud indicators
- 31-60: Suspicious patterns requiring caution
- 61-85: Minor concerns but generally safe
- 86-100: Clean, trustworthy site

IMPORTANT: Return the score as a standalone number on its own line, prefixed with "SCORE:" (e.g., "SCORE: 75")

### Top Hidden Traps
List the top 3 hidden traps or dark patterns found (or state "None detected" if clean):
1. (e.g., "Sneak into Basket" — forced auto-renewal or pre-checked hidden checkboxes)
2. (e.g., "Confirmshaming" — emotional guilt-tripping in opt-out flows)
3. (e.g., "Fake Urgency" — artificial countdowns or inventory pressure)

### Detailed Analysis
Provide a thorough but concise breakdown of:
- What the page appears to be
- Specific fraud indicators found (e.g., off-screen text, z-index hijacking, pre-checked traps)
- Privacy concerns
- Recommendations for the user

### Final Verdict
One clear sentence summarizing whether the user should trust this page.

IMPORTANT RULES:
- UNIVERSAL SCANNING: Evaluate Every Single Website strictly and equally. Do not grant a free pass to any site based on reputation. Evaluate purely on DOM evidence.
- CONTEXTUAL INTELLIGENCE: Differentiate between standard e-commerce features (e.g., normal "limited time" promotional deals, shipping fee summaries, or off-screen text for screen readers) and actual malicious intent. A standard e-commerce page might have off-screen text for accessibility or standard promotional badges—this does NOT automatically mean fraud. Only rate as Critical if there is clear evidence of deception, forced subscriptions, or concealed costs.
- SOCIAL PROOF & RATINGS: Take extracted reviews, star ratings, and review counts into account. A product with high ratings and many reviews is a strong indicator of legitimacy. Positively factor this into the Trust Score.
- SPECIFIC DARK PATTERNS: Aggressively identify "Sneak into Basket" (pre-checked checkboxes that cost money), and "Confirmshaming" (guilt-tripping buttons like "No thanks, I hate saving").
- PENALIZE ACCURATELY: If a site uses "Sneak into Basket" or "Confirmshaming", it must be penalized to Medium or Critical risk. These are manipulative dark patterns.
- REWARD SAFELY: If a page is entirely clean, transparent, or merely exhibits standard honest retail marketing, assign a High score (85-100). Do NOT assume danger without proof.
- Language: High-quality English.`;

  // ══════════════════════════════════════════════════════════════════
  // MAIN ANALYSIS FUNCTION
  // ══════════════════════════════════════════════════════════════════
  async function analyze(contextText, abortSignal) {
    const apiKey = _getApiKey();
    if (!apiKey) {
      throw new Error('API key configuration error');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze the following website content and DOM forensic findings for fraud, scams, and dark patterns:\n\n${contextText}`
      }
    ];

    const requestBody = {
      model: MODEL_ID,
      messages: messages,
      temperature: 0,
      max_completion_tokens: 2048,
      top_p: 1,
      reasoning_effort: 'high',
      stream: false,
      stop: null
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      console.error('[TrustWatch AI] API Error:', response.status, errorBody);

      if (response.status === 401) {
        throw new Error('Authentication failed — invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limited — please wait and try again');
      } else if (response.status === 503) {
        throw new Error('AI service temporarily unavailable');
      }
      throw new Error(`API Error (${response.status}): ${errorBody.substring(0, 100)}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Malformed API response');
    }

    const aiText = data.choices[0].message.content;
    return _parseAiResponse(aiText);
  }

  // ══════════════════════════════════════════════════════════════════
  // RESPONSE PARSER
  // ══════════════════════════════════════════════════════════════════
  function _parseAiResponse(text) {
    const result = {
      report: text,
      riskLevel: 'Medium',
      score: 50
    };

    // Extract SCORE: XX
    const scoreMatch = text.match(/SCORE:\s*(\d{1,3})/i);
    if (scoreMatch) {
      result.score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)));
    }

    // Extract risk level
    const riskMatch = text.match(/Risk\s*Level[:\s]*\*?\*?(Critical|Medium|Low\s*Risk|Low)/i);
    if (riskMatch) {
      const level = riskMatch[1].toLowerCase().trim();
      if (level.includes('critical')) result.riskLevel = 'Critical';
      else if (level.includes('low')) result.riskLevel = 'Low';
      else result.riskLevel = 'Medium';
    }

    // Infer risk from score if not explicitly stated
    if (!riskMatch) {
      if (result.score >= 75) result.riskLevel = 'Low';
      else if (result.score < 40) result.riskLevel = 'Critical';
    }

    return result;
  }

  // ══════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════
  return {
    analyze,
    // Expose for testing only
    _test: { _encode, _decode, _parseAiResponse }
  };

})();
