/*********************************************************
 * script.js  –  hero slider  +  chatbot + login/signup
 *********************************************************/

// 🌐 Change this to your backend URL
const API_BASE_URL = 'https://blood-bank-app-3t3e.onrender.com'; // ✅ Deployed backend
// const API_BASE_URL = 'http://localhost:3000'; // 🧪 Uncomment for local testing

/* ──────────────── 1. HERO SLIDER ──────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-slide');
  let current = 0;

  function showNextSlide() {
    if (!slides.length) return;
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }

  showNextSlide();
  setInterval(showNextSlide, 4000);
});

/* ──────────────── 2. CHATBOT UI ──────────────── */
const chatHeader = document.getElementById('chatbot-header');
const chatBody = document.getElementById('chatbot-body');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');

if (chatHeader) {
  chatHeader.addEventListener('click', () => {
    chatBody.style.display = chatBody.style.display === 'flex' ? 'none' : 'flex';
  });
}

if (chatInput) {
  chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

function addMessage(sender, text) {
  const div = document.createElement('div');
  div.className = sender === 'bot' ? 'bot-message' : 'user-message';
  div.innerHTML = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  chatInput.value = '';
  chatInput.focus();

  try {
    const res = await fetch(`${API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    addMessage('bot', data.reply || '🤖 …');
  } catch (err) {
    console.error(err);
    addMessage('bot', '⚠️ Could not reach the server.');
  }
}

/* ──────────────── 3. LOGIN/SIGNUP ──────────────── */
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) return alert('Please fill in all fields');

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      isLoggedIn = true;
      localStorage.setItem('isLoggedIn', 'true');
      updateLoginUI();
      closeAuthModal();
      alert('Login successful');
    } else {
      alert(data.message || 'Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
}

async function handleSignup() {
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  if (!username || !email || !password) return alert('Please fill in all fields');

  try {
    const res = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Signup successful!');
      switchToLogin();
    } else {
      alert(data.message || 'Signup failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  isLoggedIn = false;
  updateLoginUI();
  alert('Logged out successfully');
  window.location.href = 'index.html';
}

/* ──────────────── 4. MODAL HANDLERS ──────────────── */
function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}
function switchToSignup() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
}
function switchToLogin() {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

/* ──────────────── 5. PAGE ACCESS GUARD ──────────────── */
function accessProtectedPage() {
  if (!isLoggedIn) {
    alert('You must log in to access this page');
    openAuthModal();
    return false;
  }
  return true;
}

/* ──────────────── 6. NAVBAR UI UPDATER ──────────────── */
function updateLoginUI() {
  const navLogout = document.getElementById('nav-logout');
  const navRegister = document.getElementById('nav-register');

  if (isLoggedIn) {
    navLogout?.classList.remove('d-none');
    navRegister?.removeAttribute('disabled');
  } else {
    navLogout?.classList.add('d-none');
    navRegister?.setAttribute('disabled', true);
  }
}

/* ──────────────── 7. EVENT BINDING ──────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('signup-btn')?.addEventListener('click', handleSignup);
  document.getElementById('to-signup')?.addEventListener('click', switchToSignup);
  document.getElementById('to-login')?.addEventListener('click', switchToLogin);

  document.getElementById('cta-register')?.addEventListener('click', () => {
    if (accessProtectedPage()) window.location.href = 'register.html';
  });

  document.getElementById('nav-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (accessProtectedPage()) window.location.href = 'register.html';
  });

  document.getElementById('schedule-btn')?.addEventListener('click', () => {
    if (accessProtectedPage()) window.location.href = 'appointment.html';
  });

  updateLoginUI();
});
