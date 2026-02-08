import { supabase } from './lib/supabase.js';
import { authService } from './services/auth.service.js';
import { casesService } from './services/cases.service.js';
import { tasksService } from './services/tasks.service.js';
import { documentsService } from './services/documents.service.js';
import { callsService } from './services/calls.service.js';
import { timelineService } from './services/timeline.service.js';
import { chatService } from './services/chat.service.js';
import { lawyersService } from './services/lawyers.service.js';
import { caseTypesService } from './services/caseTypes.service.js';
import { templatesService } from './services/templates.service.js';

import { AppState } from './state/AppState.js';
import { UIManager } from './ui/UIManager.js';
import { NavigationManager } from './navigation/NavigationManager.js';
import { ChatManager } from './chat/ChatManager.js';

let appState;
let uiManager;
let navigationManager;
let chatManager;

async function initializeApp() {
  try {
    const session = await supabase.auth.getSession();

    if (session.data.session) {
      const profile = await authService.getProfile();
      await startMainApp(profile);
    } else {
      showLoginScreen();
    }

    authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);

      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, loading profile...');
        const profile = await authService.getProfile();
        console.log('Profile loaded:', profile);
        await startMainApp(profile);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        showLoginScreen();
      }
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showLoginScreen();
  }
}

function showLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="login-screen">
      <div class="login-card">
        <div class="login-logo"><i class="fas fa-scale-balanced"></i></div>
        <h2 id="auth-title">כניסה למערכת עו"ד</h2>
        <div class="form-group">
          <label>אימייל</label>
          <input type="email" id="login-email" placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label>סיסמה</label>
          <input type="password" id="login-password" placeholder="••••••••">
        </div>
        <div class="form-group" id="fullname-group" style="display: none;">
          <label>שם מלא</label>
          <input type="text" id="login-fullname" placeholder="שם מלא">
        </div>
        <div class="form-group" id="role-group" style="display: none;">
          <label>תפקיד במערכת</label>
          <select id="login-role">
            <option value="admin">מנהל משרד (יצירת משרד חדש)</option>
            <option value="lawyer">עורך דין</option>
          </select>
        </div>
        <div class="form-group" id="office-name-group" style="display: none;">
          <label>שם המשרד</label>
          <input type="text" id="login-office-name" placeholder="לדוגמה: משרד עו״ד כהן ושות׳">
        </div>
        <div id="login-error" style="color: red; font-size: 14px; margin-bottom: 10px; display: none;"></div>
        <button class="btn-login" id="btn-login">כניסה למערכת</button>
        <div style="text-align: center; margin-top: 15px;">
          <a href="#" id="toggle-mode" style="color: #4A90E2; text-decoration: none; font-size: 14px;">אין לך חשבון? הירשם כאן</a>
        </div>
      </div>
    </div>
  `;

  let isSignupMode = false;

  document.getElementById('login-role').addEventListener('change', (e) => {
    const officeNameGroup = document.getElementById('office-name-group');
    if (e.target.value === 'admin') {
      officeNameGroup.style.display = 'block';
    } else {
      officeNameGroup.style.display = 'none';
    }
  });

  document.getElementById('toggle-mode').addEventListener('click', (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;

    const title = document.getElementById('auth-title');
    const btnLogin = document.getElementById('btn-login');
    const toggleLink = document.getElementById('toggle-mode');
    const fullnameGroup = document.getElementById('fullname-group');
    const roleGroup = document.getElementById('role-group');
    const officeNameGroup = document.getElementById('office-name-group');
    const errorDiv = document.getElementById('login-error');

    errorDiv.style.display = 'none';

    if (isSignupMode) {
      title.textContent = 'הרשמה למערכת';
      btnLogin.textContent = 'הירשם';
      toggleLink.textContent = 'כבר יש לך חשבון? היכנס כאן';
      fullnameGroup.style.display = 'block';
      roleGroup.style.display = 'block';
      const roleSelect = document.getElementById('login-role');
      if (roleSelect.value === 'admin') {
        officeNameGroup.style.display = 'block';
      }
    } else {
      title.textContent = 'כניסה למערכת עו"ד';
      btnLogin.textContent = 'כניסה למערכת';
      toggleLink.textContent = 'אין לך חשבון? הירשם כאן';
      fullnameGroup.style.display = 'none';
      roleGroup.style.display = 'none';
      officeNameGroup.style.display = 'none';
    }
  });

  document.getElementById('btn-login').addEventListener('click', () => {
    if (isSignupMode) {
      handleSignup();
    } else {
      handleLogin();
    }
  });

  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (isSignupMode) {
        handleSignup();
      } else {
        handleLogin();
      }
    }
  });
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  if (!email || !password) {
    errorDiv.textContent = 'נא למלא את כל השדות';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'מתחבר...';

    await authService.signIn(email, password);
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'שגיאה בהתחברות. ';

    if (error.message && error.message.includes('Invalid login credentials')) {
      errorMessage = 'אימייל או סיסמה שגויים. אנא בדוק את פרטי ההתחברות.';
    } else if (error.message && error.message.includes('rate limit')) {
      errorMessage = 'בוצעו יותר מדי ניסיונות התחברות. אנא המתן מספר דקות ונסה שוב.';
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'אנא בדוק את פרטי ההתחברות ונסה שוב.';
    }

    errorDiv.textContent = errorMessage;
    errorDiv.style.display = 'block';

    const btn = document.getElementById('btn-login');
    btn.disabled = false;
    btn.textContent = 'כניסה למערכת';
  }
}

async function handleSignup() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const fullName = document.getElementById('login-fullname').value.trim();
  const role = document.getElementById('login-role').value;
  const officeName = document.getElementById('login-office-name').value.trim();
  const errorDiv = document.getElementById('login-error');

  if (!email || !password || !fullName) {
    errorDiv.textContent = 'נא למלא את כל השדות';
    errorDiv.style.display = 'block';
    return;
  }

  if (role === 'admin' && !officeName) {
    errorDiv.textContent = 'נא להזין שם משרד';
    errorDiv.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'נרשם...';
    errorDiv.style.display = 'none';

    console.log('Starting signup process...');
    const result = await authService.signUp(email, password, fullName, role, officeName || null);
    console.log('Signup completed:', result);

    if (result.session) {
      console.log('User has session, will auto-login');
    } else {
      console.log('No session, attempting to sign in...');
      await authService.signIn(email, password);
    }
  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = 'שגיאה בהרשמה. ';

    if (error.message && error.message.includes('rate limit')) {
      errorMessage = 'בוצעו יותר מדי ניסיונות הרשמה. אנא המתן 5-10 דקות ונסה שוב, או השתמש באימייל אחר.';
    } else if (error.message && error.message.includes('already registered')) {
      errorMessage = 'כתובת האימייל כבר רשומה במערכת. נסה להתחבר במקום להירשם.';
    } else if (error.message) {
      errorMessage += error.message;
    } else if (error.code === '23505') {
      errorMessage += 'המשתמש כבר קיים.';
    } else {
      errorMessage += 'נסה שוב מאוחר יותר.';
    }

    errorDiv.textContent = errorMessage;
    errorDiv.style.display = 'block';

    const btn = document.getElementById('btn-login');
    btn.disabled = false;
    btn.textContent = 'הירשם';
  }
}

async function startMainApp(profile) {
  appState = new AppState();
  uiManager = new UIManager(appState);
  chatManager = new ChatManager(appState);
  navigationManager = new NavigationManager(appState, uiManager, chatManager);

  await appState.loadInitialData();

  uiManager.renderMainLayout(profile);
  navigationManager.init(profile);

  window.appState = appState;
  window.uiManager = uiManager;
  window.navigationManager = navigationManager;
  window.chatManager = chatManager;
  window.currentProfile = profile;
}

document.addEventListener('DOMContentLoaded', initializeApp);
