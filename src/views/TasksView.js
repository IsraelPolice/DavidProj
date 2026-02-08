import { tasksService } from '../services/tasks.service.js';

export class TasksView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="tasks-view">
        <div class="top-bar">
          <h1 class="page-title">דאשבורד משימות והתראות</h1>
        </div>
        <div style="margin-bottom:20px; font-size:14px; color:var(--text-gray);">
          מציג משימות לפי דחיפות והתראות על מסמכים באיחור
        </div>
        <div class="tasks-dashboard-grid" id="tasks-grid-container"></div>
      </div>
    `;

    await this.renderTasks();
  }

  async renderTasks() {
    const grid = document.getElementById('tasks-grid-container');
    const allItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.appState.cases.forEach(c => {
      const allSigned = c.case_documents?.every(d => d.status === 'signed') ?? true;
      if (!allSigned && c.docs_deadline) {
        const deadline = new Date(c.docs_deadline);
        if (deadline < today) {
          allItems.push({
            type: 'doc_alert',
            priority: 100,
            caseId: c.id,
            client: `${c.first_name} ${c.last_name}`,
            text: 'איחור בחתימה על מסמכי פתיחת תיק',
            date: c.docs_deadline,
            isOverdue: true
          });
        }
      }

      if (c.case_tasks) {
        c.case_tasks.forEach(t => {
          if (!t.done) {
            let priority = 0;
            let isOverdue = false;

            if (t.deadline) {
              const dateObj = new Date(t.deadline);
              if (dateObj < today) {
                priority = 90;
                isOverdue = true;
              } else {
                const diffDays = Math.ceil((dateObj - today) / (86400000));
                if (diffDays <= 3) priority = 80;
              }
            }

            if (t.urgency === 'high') priority = Math.max(priority, 80);
            else if (t.urgency === 'medium') priority = Math.max(priority, 50);
            else priority = Math.max(priority, 10);

            allItems.push({
              type: 'task',
              priority,
              caseId: c.id,
              client: `${c.first_name} ${c.last_name}`,
              text: t.text,
              date: t.deadline,
              urgency: t.urgency,
              isOverdue
            });
          }
        });
      }
    });

    allItems.sort((a, b) => b.priority - a.priority);

    if (allItems.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748b;">אין משימות או התראות פתוחות</div>';
      return;
    }

    grid.innerHTML = allItems.map(item => {
      const urgencyClass = item.type === 'doc_alert' ? 'high' : item.urgency;
      const badgeHtml = item.type === 'doc_alert' ?
        `<span class="task-badge tb-urgent"><i class="fas fa-exclamation-triangle"></i> דחוף - מסמכים</span>` :
        (item.isOverdue ? `<span class="task-badge tb-urgent">באיחור</span>` : '');

      const iconHtml = item.type === 'doc_alert' ?
        `<i class="fas fa-file-contract" style="color:#ef4444; font-size:18px;"></i>` :
        `<i class="fas fa-tasks" style="color:#64748b; font-size:18px;"></i>`;

      const dateDisplay = item.date ?
        `<span class="task-date ${item.isOverdue ? 'overdue' : ''}">
          <i class="far fa-clock"></i> ${new Date(item.date).toLocaleDateString('he-IL')}
        </span>` : '';

      return `
        <div class="task-card ${urgencyClass}" data-case-id="${item.caseId}">
          <div class="task-header">
            <span class="task-client">${item.client}</span>
            ${badgeHtml}
          </div>
          <div style="margin-bottom:10px;">${iconHtml}</div>
          <div class="task-body">${item.text}</div>
          <div class="task-meta">
            ${dateDisplay}
            <button class="btn-task-action">לתיק <i class="fas fa-arrow-left"></i></button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const caseId = card.getAttribute('data-case-id');
        this.navigationManager.openCase(caseId);
      });
    });
  }
}
