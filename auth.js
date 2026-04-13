/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — auth.js
   Firebase Authentication (Email/Password + Google)
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// FIREBASE CONFIG
// ══════════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDdXRsmTdCPS0VPdzN03XTV0KOU0MHk1Ck",
  authDomain: "trustname-ai.firebaseapp.com",
  projectId: "trustname-ai",
  storageBucket: "trustname-ai.firebasestorage.app",
  messagingSenderId: "1041993240362",
  appId: "1:1041993240362:web:e6111b579a438329525853",
  measurementId: "G-CBMCL5BB5M"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ══════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ══════════════════════════════════════════════════════════════════
const $loading = document.getElementById('authLoading');
const $container = document.getElementById('authContainer');
const $tabLogin = document.getElementById('tabLogin');
const $tabSignup = document.getElementById('tabSignup');
const $loginForm = document.getElementById('loginForm');
const $signupForm = document.getElementById('signupForm');
const $message = document.getElementById('authMessage');

// ══════════════════════════════════════════════════════════════════
// AUTH STATE CHECK — redirect if logged in
// ══════════════════════════════════════════════════════════════════
auth.onAuthStateChanged(async (user) => {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');

  if (action === 'logout') {
    try {
      await auth.signOut();
      window.location.href = 'homepage.html';
    } catch (e) {
      console.error('[TrustWatch] Logout error:', e);
    }
    return;
  }

  if (user) {
    // User is signed in → go to scanner
    window.location.href = 'popup.html';
  } else {
    if (!action) {
      // If no action parameter, direct to homepage first
      window.location.href = 'homepage.html';
    } else {
      // Not signed in & action=login → show auth form
      $loading.classList.add('fade-out');
      setTimeout(() => {
        $loading.style.display = 'none';
        $container.style.display = 'flex';
      }, 300);
    }
  }
});

// ══════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════════════════════════════
$tabLogin.addEventListener('click', () => switchTab('login'));
$tabSignup.addEventListener('click', () => switchTab('signup'));

function switchTab(tab) {
  hideMessage();
  if (tab === 'login') {
    $tabLogin.classList.add('active');
    $tabSignup.classList.remove('active');
    $loginForm.classList.remove('hidden');
    $signupForm.classList.add('hidden');
  } else {
    $tabSignup.classList.add('active');
    $tabLogin.classList.remove('active');
    $signupForm.classList.remove('hidden');
    $loginForm.classList.add('hidden');
  }
}

// ══════════════════════════════════════════════════════════════════
// LOGIN — Email/Password
// ══════════════════════════════════════════════════════════════════
$loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmit');

  if (!email || !password) {
    showMessage('Please fill in all fields.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showMessage('✅ Login successful! Redirecting...', 'success');
    // onAuthStateChanged will handle redirect
  } catch (err) {
    showMessage(getErrorMessage(err.code), 'error');
    btn.disabled = false;
    btn.innerHTML = '⚡ Sign In';
  }
});

// ══════════════════════════════════════════════════════════════════
// SIGNUP — Email/Password
// ══════════════════════════════════════════════════════════════════
$signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const btn = document.getElementById('signupSubmit');

  if (!name || !email || !password) {
    showMessage('Please fill in all fields.', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account...';

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    // Update display name
    await userCredential.user.updateProfile({ displayName: name });
    showMessage('✅ Account created! Redirecting...', 'success');
    // onAuthStateChanged will handle redirect
  } catch (err) {
    showMessage(getErrorMessage(err.code), 'error');
    btn.disabled = false;
    btn.innerHTML = '🛡️ Create Account';
  }
});

// ══════════════════════════════════════════════════════════════════
// GOOGLE SIGN-IN
// ══════════════════════════════════════════════════════════════════
document.getElementById('googleLoginBtn').addEventListener('click', googleSignIn);
document.getElementById('googleSignupBtn').addEventListener('click', googleSignIn);

async function googleSignIn() {
  hideMessage();

  try {
    // For Chrome extensions, use chrome.identity if available
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.launchWebAuthFlow) {
      await googleSignInExtension();
    } else {
      // Fallback: signInWithPopup (works in browser, not in extension popup)
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    }
  } catch (err) {
    console.error('[TrustWatch] Google Sign-In error:', err);
    showMessage(getErrorMessage(err.code || err.message), 'error');
  }
}

async function googleSignInExtension() {
  return new Promise((resolve, reject) => {
    const clientId = '1041993240362-YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com';
    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = ['openid', 'email', 'profile'];
    
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
      '?client_id=' + encodeURIComponent(clientId) +
      '&response_type=id_token' +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=' + encodeURIComponent(scopes.join(' ')) +
      '&nonce=' + Math.random().toString(36).substring(2);

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        // Extract id_token from URL
        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const idToken = params.get('id_token');
        
        if (idToken) {
          const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
          auth.signInWithCredential(credential)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('No ID token received'));
        }
      }
    );
  });
}

// ══════════════════════════════════════════════════════════════════
// PASSWORD TOGGLE
// ══════════════════════════════════════════════════════════════════
document.getElementById('loginPwdToggle').addEventListener('click', () => {
  togglePassword('loginPassword', 'loginPwdToggle');
});

document.getElementById('signupPwdToggle').addEventListener('click', () => {
  togglePassword('signupPassword', 'signupPwdToggle');
});

function togglePassword(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// ══════════════════════════════════════════════════════════════════
// MESSAGE HELPERS
// ══════════════════════════════════════════════════════════════════
function showMessage(text, type) {
  $message.textContent = text;
  $message.className = 'auth-message ' + type;
}

function hideMessage() {
  $message.className = 'auth-message';
  $message.textContent = '';
}

function getErrorMessage(code) {
  const errors = {
    'auth/email-already-in-use': '⚠️ This email is already registered. Try signing in.',
    'auth/invalid-email': '⚠️ Invalid email address.',
    'auth/user-not-found': '⚠️ No account found with this email.',
    'auth/wrong-password': '⚠️ Incorrect password. Please try again.',
    'auth/weak-password': '⚠️ Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': '⚠️ Too many attempts. Please wait and try again.',
    'auth/network-request-failed': '⚠️ Network error. Check your connection.',
    'auth/popup-closed-by-user': '⚠️ Sign-in popup was closed.',
    'auth/invalid-credential': '⚠️ Invalid credentials. Please check and try again.',
  };
  if (typeof code === 'string' && code.includes('did not approve access')) {
    return '⚠️ Google Sign-In was cancelled.';
  }
  return errors[code] || `⚠️ Authentication error: ${code}`;
}

console.log('[TrustWatch AI] Auth page loaded.');
