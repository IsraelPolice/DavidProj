export class DashboardView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="dashboard-view">
        <div class="top-bar">
          <h1 class="page-title">דאשבורד מנהל</h1>
        </div>
        <div class="dashboard-stats" id="dashboard-stats"></div>
        <div class="dashboard-content">
          <div class="dashboard-section">
            <h3 class="section-title">תיקים לפי סטטוס</h3>
            <div class="chart-container" id="cases-by-status"></div>
          </div>
          <div class="dashboard-section">
            <h3 class="section-title">משימות דחופות</h3>
            <div class="urgent-tasks-list" id="urgent-tasks"></div>
          </div>
          <div class="dashboard-section">
            <h3 class="section-title">פעילות אחרונה</h3>
            <div class="activity-list" id="recent-activity"></div>
          </div>
        </div>
      </div>
    `;

    await this.renderDashboard();
  }

  async renderDashboard() {
    await this.renderStats();
    this.renderCasesByStatus();
    this.renderUrgentTasks();
    this.renderRecentActivity();
  }

  async renderStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    const cases = this.appState.cases;

    const openCases = cases.filter(c => c.status === 'open').length;
    const inProcessCases = cases.filter(c => c.status === 'process').length;
    const closedCases = cases.filter(c => c.status === 'closed').length;

    const allTasks = cases.flatMap(c => c.case_tasks || []);
    const pendingTasks = allTasks.filter(t => !t.done).length;
    const urgentTasks = allTasks.filter(t => !t.done && t.urgency === 'high').length;

    const allMessages = cases.flatMap(c => c.chat_messages || []);
    const unreadMessages = allMessages.filter(m => m.sender === 'client').length;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
          <i class="fas fa-folder-open"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">${openCases}</div>
          <div class="stat-label">תיקים פתוחים</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7; color: #d97706;">
          <i class="fas fa-sync"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">${inProcessCases}</div>
          <div class="stat-label">בטיפול</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #d1fae5; color: #059669;">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">${closedCases}</div>
          <div class="stat-label">תיקים סגורים</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fee2e2; color: #dc2626;">
          <i class="fas fa-tasks"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">${urgentTasks}</div>
          <div class="stat-label">משימות דחופות</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #e0e7ff; color: #4f46e5;">
          <i class="fas fa-envelope"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">${unreadMessages}</div>
          <div class="stat-label">הודעות מלקוחות</div>
        </div>
      </div>
    `;
  }

  renderCasesByStatus() {
    const container = document.getElementById('cases-by-status');
    const cases = this.appState.cases;

    const byStatus = {
      open: cases.filter(c => c.status === 'open').length,
      process: cases.filter(c => c.status === 'process').length,
      closed: cases.filter(c => c.status === 'closed').length
    };

    const total = byStatus.open + byStatus.process + byStatus.closed || 1;

    container.innerHTML = `
      <div class="status-bar">
        <div class="status-segment" style="width: ${(byStatus.open / total) * 100}%; background: #3b82f6;" title="פתוחים: ${byStatus.open}"></div>
        <div class="status-segment" style="width: ${(byStatus.process / total) * 100}%; background: #f59e0b;" title="בטיפול: ${byStatus.process}"></div>
        <div class="status-segment" style="width: ${(byStatus.closed / total) * 100}%; background: #10b981;" title="סגורים: ${byStatus.closed}"></div>
      </div>
      <div class="status-legend">
        <div class="legend-item">
          <span class="legend-color" style="background: #3b82f6;"></span>
          <span>פתוחים (${byStatus.open})</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f59e0b;"></span>
          <span>בטיפול (${byStatus.process})</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #10b981;"></span>
          <span>סגורים (${byStatus.closed})</span>
        </div>
      </div>
    `;
  }

  renderUrgentTasks() {
    const container = document.getElementById('urgent-tasks');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentTasks = [];
    this.appState.cases.forEach(c => {
      if (c.case_tasks) {
        c.case_tasks.forEach(t => {
          if (!t.done && (t.urgency === 'high' || (t.deadline && new Date(t.deadline) < today))) {
            urgentTasks.push({
              ...t,
              caseId: c.id,
              clientName: `${c.first_name} ${c.last_name}`
            });
          }
        });
      }
    });

    urgentTasks.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });

    if (urgentTasks.length === 0) {
      container.innerHTML = '<p style="color: var(--text-gray); padding: 20px; text-align: center;">אין משימות דחופות</p>';
      return;
    }

    container.innerHTML = urgentTasks.slice(0, 5).map(task => `
      <div class="urgent-task-item" data-task-id="${task.id}" data-case-id="${task.caseId}">
        <div class="urgent-task-header">
          <span class="urgent-task-client">${task.clientName}</span>
          ${task.deadline ? `<span class="urgent-task-date">${new Date(task.deadline).toLocaleDateString('he-IL')}</span>` : ''}
        </div>
        <div class="urgent-task-text">${task.text}</div>
        <div class="urgent-task-actions">
          <button class="btn-task-done" data-task-id="${task.id}">
            <i class="fas fa-check"></i> סמן כבוצע
          </button>
          <button class="btn-task-view" data-case-id="${task.caseId}">
            <i class="fas fa-eye"></i> צפה בתיק
          </button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-task-done').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        await this.markTaskDone(taskId);
      });
    });

    document.querySelectorAll('.btn-task-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const caseId = btn.getAttribute('data-case-id');
        this.navigationManager.openCase(caseId);
      });
    });
  }

  async markTaskDone(taskId) {
    try {
      const { tasksService } = await import('../services/tasks.service.js');
      await tasksService.updateTask(taskId, { done: true });
      await this.appState.loadCases();
      await this.renderDashboard();
    } catch (error) {
      console.error('Failed to mark task as done:', error);
      alert('שגיאה בעדכון המשימה');
    }
  }

  renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    const activities = [];

    this.appState.cases.forEach(c => {
      if (c.chat_messages && c.chat_messages.length > 0) {
        c.chat_messages.slice(-3).forEach(msg => {
          activities.push({
            type: 'message',
            caseId: c.id,
            clientName: `${c.first_name} ${c.last_name}`,
            text: msg.message,
            time: new Date(msg.sent_at)
          });
        });
      }
    });

    activities.sort((a, b) => b.time - a.time);

    if (activities.length === 0) {
      container.innerHTML = '<p style="color: var(--text-gray); padding: 20px; text-align: center;">אין פעילות אחרונה</p>';
      return;
    }

    container.innerHTML = activities.slice(0, 10).map(activity => `
      <div class="activity-item" data-case-id="${activity.caseId}">
        <div class="activity-icon">
          <i class="fas fa-comment"></i>
        </div>
        <div class="activity-content">
          <div class="activity-header">
            <strong>${activity.clientName}</strong>
            <span class="activity-time">${activity.time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="activity-text">${activity.text}</div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.activity-item').forEach(item => {
      item.addEventListener('click', () => {
        const caseId = item.getAttribute('data-case-id');
        this.navigationManager.openCase(caseId);
      });
    });
  }
}
