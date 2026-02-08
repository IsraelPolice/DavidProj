import { authService } from '../services/auth.service.js';
import { CasesView } from '../views/CasesView.js';
import { TasksView } from '../views/TasksView.js';
import { MessagesView } from '../views/MessagesView.js';
import { ManagementView } from '../views/ManagementView.js';
import { CaseDetailView } from '../views/CaseDetailView.js';
import { DashboardView } from '../views/DashboardView.js';

export class NavigationManager {
  constructor(appState, uiManager) {
    this.appState = appState;
    this.uiManager = uiManager;
    this.views = {
      dashboard: new DashboardView(appState, this),
      cases: new CasesView(appState, this),
      tasks: new TasksView(appState, this),
      msgs: new MessagesView(appState, this),
      mgmt: new ManagementView(appState, this),
      detail: new CaseDetailView(appState, this)
    };
  }

  init(profile) {
    document.querySelectorAll('.nav-links a[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    document.getElementById('nav-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        await authService.signOut();
      }
    });

    const defaultView = profile?.role === 'admin' ? 'dashboard' : 'cases';
    this.navigateTo(defaultView);
  }

  navigateTo(viewName, params = {}) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-links a[data-view="${viewName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    const container = document.getElementById('view-container');
    const chatWindow = document.getElementById('chat-window');

    if (viewName === 'detail' && params.caseId) {
      if (chatWindow) chatWindow.style.display = 'flex';
      this.views.detail.render(params.caseId);
    } else {
      if (chatWindow) chatWindow.style.display = 'none';
      if (this.views[viewName]) {
        this.views[viewName].render();
      }
    }

    this.appState.setCurrentView(viewName);
  }

  openCase(caseId) {
    this.navigateTo('detail', { caseId });
  }

  backToCases() {
    this.navigateTo('cases');
  }
}
