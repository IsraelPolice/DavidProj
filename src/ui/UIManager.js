export class UIManager {
  constructor(appState) {
    this.appState = appState;
  }

  renderMainLayout(profile) {
    const app = document.getElementById('app');

    const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();

    app.innerHTML = `
      <div id="main-layout" style="display: flex;">
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="lawyer-avatar">${initials}</div>
            <div class="lawyer-info">
              <h3>${profile.full_name}</h3>
              <span>${this.getRoleLabel(profile.role)}</span>
            </div>
          </div>
          <ul class="nav-links">
            ${profile.role === 'admin' ? `
            <li><a id="nav-dashboard" class="active" data-view="dashboard">
              <span class="nav-text"><i class="fas fa-chart-line"></i> דאשבורד</span>
            </a></li>
            ` : ''}
            <li><a id="nav-cases" ${profile.role !== 'admin' ? 'class="active"' : ''} data-view="cases">
              <span class="nav-text"><i class="fas fa-folder-open"></i> תיקים ומסמכים</span>
            </a></li>
            <li><a id="nav-tasks" data-view="tasks">
              <span class="nav-text"><i class="fas fa-bell"></i> משימות והתראות</span>
              <span class="badge hidden" id="task-badge">0</span>
            </a></li>
            <li><a id="nav-msgs" data-view="msgs">
              <span class="nav-text"><i class="fas fa-comment-dots"></i> הודעות מלקוחות</span>
              <span class="badge hidden" id="msg-badge">0</span>
            </a></li>
            ${profile.role === 'admin' ? `
            <li><a id="nav-mgmt" data-view="mgmt">
              <span class="nav-text"><i class="fas fa-cogs"></i> ניהול מערכת</span>
            </a></li>
            ` : ''}
            <li><a id="nav-logout">
              <span class="nav-text"><i class="fas fa-sign-out-alt"></i> התנתקות</span>
            </a></li>
          </ul>
        </aside>

        <main class="content-area" id="content-area">
          <div id="view-container"></div>
        </main>
      </div>

      <!-- Floating Chat Window -->
      <div class="floating-chat minimized" id="chat-window" style="display:none;">
        <div class="chat-header" id="chat-header-toggle">
          <span><i class="far fa-comments"></i> צ'אט</span>
          <i class="fas fa-chevron-up" id="chat-toggle-icon"></i>
        </div>
        <div class="chat-body" id="chat-body"></div>
        <div class="chat-footer">
          <button class="btn-chat-action"><i class="fas fa-paperclip"></i></button>
          <input type="text" class="chat-input" placeholder="הודעה..." id="chat-input">
          <button class="btn-chat-action" id="btn-send-chat"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>

      <!-- Modal Templates (will be injected dynamically) -->
      <div id="modals-container"></div>
    `;
  }

  getRoleLabel(role) {
    const labels = {
      'admin': 'מנהל מערכת',
      'lawyer': 'עורך דין',
      'assistant': 'עוזר/ת'
    };
    return labels[role] || 'עורך דין';
  }

  showLoading() {
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--accent);"></i>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
          <h3 style="color: var(--text-dark); margin-bottom: 10px;">שגיאה</h3>
          <p style="color: var(--text-gray);">${message}</p>
        </div>
      `;
    }
  }

  updateBadges(cases) {
    let msgCount = 0;
    let taskCount = 0;

    cases.forEach(c => {
      if (c.chat_messages && c.chat_messages.length > 0) {
        const lastMsg = c.chat_messages[c.chat_messages.length - 1];
        if (lastMsg.sender === 'client') msgCount++;
      }

      if (c.case_tasks) {
        taskCount += c.case_tasks.filter(t => !t.done).length;
      }

      const allSigned = c.case_documents ?
        c.case_documents.every(d => d.status === 'signed') : true;
      const isOverdue = !allSigned && c.docs_deadline &&
        new Date(c.docs_deadline) < new Date().setHours(0, 0, 0, 0);

      if (isOverdue) taskCount++;
    });

    const msgBadge = document.getElementById('msg-badge');
    if (msgBadge) {
      msgBadge.innerText = msgCount;
      msgBadge.classList.toggle('hidden', msgCount === 0);
    }

    const taskBadge = document.getElementById('task-badge');
    if (taskBadge) {
      taskBadge.innerText = taskCount;
      taskBadge.classList.toggle('hidden', taskCount === 0);
    }
  }
}
