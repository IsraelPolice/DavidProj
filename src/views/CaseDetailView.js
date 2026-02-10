/**
 * CaseDetailView - תצוגת פרטי תיק מלאה
 */
export class CaseDetailView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render(caseId) {
    const container = document.getElementById("view-container");
    if (!container) return;

    container.innerHTML = `
      <div style="padding:100px; text-align:center;">
        <div class="spinner" style="margin-bottom:20px;"></div>
        <div style="font-size:1.2rem; color:var(--text-gray);">טוען נתוני תיק...</div>
      </div>
    `;

    try {
      await this.appState.loadCaseById(caseId);
      const c = this.appState.currentCase;

      if (!c) {
        this.renderNotFound(container);
        return;
      }

      this.renderContent(c);
    } catch (error) {
      console.error("Error rendering case detail:", error);
      this.renderError(container, error.message);
    }
  }

  renderNotFound(container) {
    container.innerHTML = `
      <div style="padding:100px; text-align:center;">
        <i class="fas fa-search" style="font-size:48px; color:var(--text-gray); opacity:0.3;"></i>
        <h3 style="margin-top:20px;">תיק לא נמצא</h3>
        <button class="btn-new" onclick="window.navigationManager.backToCases()" style="margin-top:20px;">חזרה לרשימה</button>
      </div>
    `;
  }

  renderError(container, message) {
    container.innerHTML = `
      <div style="padding:100px; text-align:center;">
        <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#ef4444; margin-bottom:20px;"></i>
        <h3>שגיאה בטעינת התיק</h3>
        <p style="color:#64748b; margin-top:10px;">${message}</p>
        <button class="btn-new" onclick="window.navigationManager.backToCases()" style="margin-top:20px;">חזרה לרשימה</button>
      </div>
    `;
  }

  renderContent(c) {
    const fullName =
      `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
      c.title ||
      "תיק ללא שם";
    const lawyerNames =
      c.case_lawyers
        ?.map((cl) => cl.lawyer?.full_name || cl.lawyer?.name)
        .filter(Boolean)
        .join(", ") || "לא מונה";

    const timeline = c.timeline_events || [];
    const medicalEvents = timeline.filter((e) => e.event_type === "medical");
    const legalEvents = timeline.filter((e) => e.event_type === "legal");
    const tasks = c.case_tasks || [];
    const docs = c.case_documents || [];

    const container = document.getElementById("view-container");
    container.innerHTML = `
      <div id="case-detail-view">
        <button class="back-btn" id="btn-back">
          <i class="fas fa-arrow-right"></i> חזרה לרשימה
        </button>

        <div class="top-bar">
          <div>
            <h1 class="page-title">${fullName}</h1>
            <div class="case-meta-info">
              <span><strong>תיק משרד:</strong> ${c.case_num || "-"}</span>
              <span><strong>נפתח ב:</strong> ${c.open_date ? new Date(c.open_date).toLocaleDateString("he-IL") : "-"}</span>
            </div>
          </div>
          <div>
            <select id="detail-status-select" class="status-select status-${c.status || "open"}">
              <option value="open" ${c.status === "open" ? "selected" : ""}>פתוח</option>
              <option value="process" ${c.status === "process" ? "selected" : ""}>בטיפול</option>
              <option value="closed" ${c.status === "closed" ? "selected" : ""}>סגור</option>
            </select>
          </div>
        </div>

        <div class="details-grid">
          <div class="left-col">
            <div class="section-card">
              <div class="section-title"><span>ציר זמן רפואי</span> <i class="fas fa-heartbeat"></i></div>
              <div class="timeline-container">${this.renderTimeline(medicalEvents)}</div>
            </div>
            <div class="section-card">
              <div class="section-title"><span>ציר זמן משפטי</span> <i class="fas fa-gavel"></i></div>
              <div class="timeline-container">${this.renderTimeline(legalEvents)}</div>
            </div>
          </div>

          <div class="right-col">
            <div class="section-card">
              <div class="section-title">פרטי לקוח</div>
              <div class="info-row"><span class="info-label">ת.ז:</span><span>${c.tz || "-"}</span></div>
              <div class="info-row"><span class="info-label">טלפון:</span><span>${c.phone || "-"}</span></div>
              <div class="info-row"><span class="info-label">עו"ד מטפל:</span><span>${lawyerNames}</span></div>
            </div>
            <div class="section-card">
              <div class="section-title">משימות <span class="counter-badge">${tasks.filter((t) => !t.done).length}</span></div>
              <ul class="task-list">${this.renderTasksList(tasks)}</ul>
            </div>
             <div class="section-card">
              <div class="section-title">מסמכים</div>
              <ul class="docs-status-list">${this.renderDocsList(docs)}</ul>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById("btn-back")?.addEventListener("click", () => {
      this.navigationManager.backToCases();
    });

    document
      .getElementById("detail-status-select")
      ?.addEventListener("change", async (e) => {
        const c = this.appState.currentCase;
        try {
          await this.appState.updateCase(c.id, { status: e.target.value });
          e.target.className = `status-select status-${e.target.value}`;
        } catch (err) {
          alert("שגיאה בעדכון הסטטוס");
        }
      });
  }

  renderTasksList(tasks) {
    if (!tasks || !tasks.length)
      return '<li class="empty-list">אין משימות</li>';
    return tasks
      .map(
        (t) => `
      <li class="task-item ${t.done ? "task-done" : ""}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${t.done ? "checked" : ""}>
          <div class="task-content">
            <span class="task-text">${t.text || t.title}</span>
            ${t.deadline ? `<div class="task-details-row"><span class="task-deadline"><i class="far fa-calendar"></i> ${new Date(t.deadline).toLocaleDateString("he-IL")}</span></div>` : ""}
          </div>
        </div>
      </li>
    `,
      )
      .join("");
  }

  renderDocsList(docs) {
    if (!docs || !docs.length) return '<li class="empty-list">אין מסמכים</li>';
    const getBadgeInfo = (status) => {
      if (status === "signed") return { class: "badge-signed", text: "חתום" };
      if (status === "sent") return { class: "badge-sent", text: "נשלח" };
      return { class: "badge-none", text: "טרם נשלח" };
    };

    return docs
      .map((doc) => {
        const badge = getBadgeInfo(doc.status);
        return `
        <li class="doc-status-item">
          <span class="doc-name">${doc.doc_name || doc.name}</span>
          <span class="doc-badge ${badge.class}">${badge.text}</span>
        </li>
      `;
      })
      .join("");
  }

  renderTimeline(events) {
    if (!events || !events.length)
      return '<div class="empty-timeline">אין אירועים</div>';

    return [...events]
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .map((event) => {
        const dateStr = event.event_date
          ? new Date(event.event_date).toLocaleDateString("he-IL")
          : "-";
        const filesHtml =
          event.event_files
            ?.map(
              (f) => `
          <div class="file-item-modern">
            <i class="far fa-file file-icon"></i>
            <span class="file-name">${f.file_name}</span>
          </div>
        `,
            )
            .join("") || "";

        return `
          <div class="timeline-item ${event.is_template ? "purple-theme" : ""}">
            <div class="timeline-dot"></div>
            <div class="timeline-date"><span>${dateStr}</span></div>
            <div class="timeline-content">
              <div class="timeline-title">${event.title}</div>
              ${event.description ? `<div class="timeline-desc">${event.description}</div>` : ""}
              ${filesHtml ? `<div class="attached-files">${filesHtml}</div>` : ""}
            </div>
          </div>
        `;
      })
      .join("");
  }
}
