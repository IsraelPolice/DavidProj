export class CaseDetailView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render(caseId) {
    try {
      await this.appState.loadCaseById(caseId);
      const c = this.appState.currentCase;

      if (!c) {
        const container = document.getElementById('view-container');
        container.innerHTML = '<div style="padding:40px; text-align:center;">תיק לא נמצא</div>';
        return;
      }

      this.renderContent(c);
    } catch (error) {
      console.error('Error rendering case detail:', error);
      const container = document.getElementById('view-container');
      container.innerHTML = `
        <div style="padding:40px; text-align:center;">
          <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#ef4444; margin-bottom:20px;"></i>
          <h3>שגיאה בטעינת התיק</h3>
          <p style="color:#64748b; margin-top:10px;">${error.message}</p>
          <button class="btn-new" onclick="window.navigationManager.backToCases()" style="margin-top:20px;">
            חזרה לרשימת התיקים
          </button>
        </div>
      `;
    }
  }

  renderContent(c) {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    const lawyerNames = c.case_lawyers?.map(cl => cl.lawyer.name).join(', ') || '-';

    const medicalEvents = c.timeline_events?.filter(e => e.event_type === 'medical') || [];
    const legalEvents = c.timeline_events?.filter(e => e.event_type === 'legal') || [];
    const medicalTimelineHtml = this.renderTimeline(medicalEvents);
    const legalTimelineHtml = this.renderTimeline(legalEvents);
    const tasksHtml = this.renderTasksList(c.case_tasks || []);
    const callsHtml = this.renderCallsList(c.case_calls || []);
    const docsHtml = this.renderDocsList(c.case_documents || []);

    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="case-detail-view">
        <button class="back-btn" id="btn-back">
          <i class="fas fa-arrow-right"></i> חזרה לרשימה
        </button>

        <div class="top-bar">
          <div>
            <h1 class="page-title">${fullName}</h1>
            <div class="case-meta-info">
              <span>תיק משרד: ${c.case_num}</span>
              <span>ת.א: ${c.ta_num || '-'}</span>
              <span>נפתח ב: ${c.open_date || '-'}</span>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items: center;">
            <button class="btn-new" id="btn-merge-docs">
              <i class="far fa-file-pdf"></i> מיזוג והפקת חוברת
            </button>
            <select id="detail-status-select" class="status-select status-${c.status}">
              <option value="open" ${c.status === 'open' ? 'selected' : ''}>פתוח</option>
              <option value="process" ${c.status === 'process' ? 'selected' : ''}>בטיפול</option>
              <option value="closed" ${c.status === 'closed' ? 'selected' : ''}>סגור</option>
            </select>
          </div>
        </div>

        <div class="details-grid">
          <div class="left-col">
            <div class="section-card">
              <div class="section-title">
                ציר זמן רפואי <i class="fas fa-heartbeat" style="color:#10b981;"></i>
              </div>
              <div class="timeline-container" id="medical-timeline">
                ${medicalTimelineHtml}
              </div>
            </div>

            <div class="section-card">
              <div class="section-title">
                ציר זמן משפטי <i class="fas fa-gavel" style="color:#6366f1;"></i>
              </div>
              <div class="timeline-container" id="legal-timeline">
                ${legalTimelineHtml}
              </div>
            </div>
          </div>

          <div class="right-col">
            <div class="section-card">
              <div class="section-title">פרטי לקוח</div>
              <div class="info-row">
                <span class="info-label">ת.ז:</span>
                <span class="info-val">${c.tz || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">קופת חולים:</span>
                <span class="info-val">${c.hmo || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">טלפון:</span>
                <span class="info-val">${c.phone || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">כתובת:</span>
                <span class="info-val">${c.street || ''} ${c.city || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">עו"ד מטפל:</span>
                <span class="info-val">${lawyerNames}</span>
              </div>
            </div>

            <div class="section-card">
              <div class="section-title">
                משימות ומעקב
                <span class="counter-badge">${c.case_tasks?.filter(t => !t.done).length || 0}</span>
              </div>
              <ul class="task-list" id="general-tasks-list">
                ${tasksHtml}
              </ul>
            </div>

            <div class="section-card">
              <div class="section-title">
                תיעוד שיחות
                <span class="counter-badge">${c.case_calls?.length || 0}</span>
              </div>
              <ul class="call-log-list" id="call-log-list">
                ${callsHtml}
              </ul>
            </div>

            <div class="section-card">
              <div class="section-title">סטטוס מסמכי ייצוג</div>
              <ul class="docs-status-list">
                ${docsHtml}
              </ul>
            </div>
          </div>
        </div>

        <!-- Floating Chat Button -->
        <button class="chat-bubble-btn" id="chat-bubble-btn">
          <i class="fas fa-comment-dots"></i>
        </button>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('btn-back')?.addEventListener('click', () => {
      this.navigationManager.backToCases();
    });

    document.getElementById('detail-status-select')?.addEventListener('change', async (e) => {
      const c = this.appState.currentCase;
      await this.appState.updateCase(c.id, { status: e.target.value });
      this.render(c.id);
    });

    document.getElementById('btn-merge-docs')?.addEventListener('click', () => {
      alert('פונקציונליות מיזוג והפקת חוברת - בפיתוח');
    });

    document.getElementById('chat-bubble-btn')?.addEventListener('click', () => {
      if (window.chatManager) {
        window.chatManager.openChat();
      }
    });
  }

  renderTasksList(tasks) {
    if (!tasks || tasks.length === 0) {
      return '<li style="padding:10px; color:#999;">אין משימות</li>';
    }

    try {
      return tasks.map(t => {
        const urgency = t.urgency || 'low';
        const urgencyClass = `task-urgent-${urgency}`;
        const doneClass = t.done ? 'task-done' : '';
        const text = t.text || 'משימה ללא תיאור';

        let deadlineHtml = '';
        if (t.deadline) {
          try {
            const deadlineDate = new Date(t.deadline).toLocaleDateString('he-IL');
            deadlineHtml = `
              <div class="task-details-row">
                <span class="task-deadline">
                  <i class="far fa-calendar"></i>
                  ${deadlineDate}
                </span>
              </div>
            `;
          } catch (e) {
            console.error('Error parsing deadline:', e);
          }
        }

        return `
          <li class="task-item ${urgencyClass} ${doneClass}">
            <div class="task-left">
              <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''} disabled>
              <div class="task-content">
                <span class="task-text">${text}</span>
                ${deadlineHtml}
              </div>
            </div>
          </li>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering tasks:', error);
      return '<li style="padding:10px; color:#ef4444;">שגיאה בטעינת משימות</li>';
    }
  }

  renderCallsList(calls) {
    if (!calls || calls.length === 0) {
      return '<li style="padding:10px; color:#999;">אין שיחות מתועדות</li>';
    }

    try {
      return calls.slice(0, 5).map(call => {
        const callDate = call.call_date || '-';
        const content = call.content || 'אין תוכן';

        return `
          <li class="call-log-item">
            <div class="call-meta">${callDate}</div>
            <div class="call-content">${content}</div>
          </li>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering calls:', error);
      return '<li style="padding:10px; color:#ef4444;">שגיאה בטעינת שיחות</li>';
    }
  }

  renderDocsList(docs) {
    if (!docs || docs.length === 0) {
      return '<li style="padding:10px; color:#999;">אין מסמכים</li>';
    }

    try {
      return docs.map(doc => {
        let badgeClass = 'badge-none';
        let badgeText = 'טרם נשלח';

        if (doc.status === 'sent') {
          badgeClass = 'badge-sent';
          badgeText = 'נשלח';
        } else if (doc.status === 'signed') {
          badgeClass = 'badge-signed';
          badgeText = 'חתום';
        }

        const docName = doc.doc_name || 'מסמך ללא שם';

        return `
          <li class="doc-status-item">
            <span class="doc-name">${docName}</span>
            <span class="doc-badge ${badgeClass}">${badgeText}</span>
          </li>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering docs:', error);
      return '<li style="padding:10px; color:#ef4444;">שגיאה בטעינת מסמכים</li>';
    }
  }

  renderTimeline(events) {
    if (!events || events.length === 0) {
      return '<div style="padding:20px; color:#999; text-align:center;">אין אירועים</div>';
    }

    try {
      const sorted = [...events].sort((a, b) =>
        new Date(a.event_date) - new Date(b.event_date)
      );

      return sorted.map(event => {
        const purpleClass = event.is_template ? 'purple-theme' : '';
        const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('he-IL') : '-';
        const title = event.title || 'אין כותרת';
        const description = event.description || '';

        let filesHtml = '';
        if (event.event_files && Array.isArray(event.event_files) && event.event_files.length > 0) {
          const filesItems = event.event_files.map(f => `
            <div class="file-item-modern">
              <i class="far fa-file file-icon"></i>
              <span class="file-name">${f.file_name || 'קובץ ללא שם'}</span>
            </div>
          `).join('');

          filesHtml = `
            <div class="timeline-actions">
              <div class="attached-files">
                ${filesItems}
              </div>
            </div>
          `;
        }

        return `
          <div class="timeline-item ${purpleClass}">
            <div class="timeline-dot"></div>
            <div class="timeline-date">
              <span>${eventDate}</span>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">${title}</div>
              ${description ? `<div class="timeline-desc">${description}</div>` : ''}
              ${filesHtml}
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error rendering timeline:', error);
      return '<div style="padding:20px; color:#ef4444; text-align:center;">שגיאה בטעינת ציר הזמן</div>';
    }
  }
}
