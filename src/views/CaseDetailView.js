/**
 * CaseDetailView - תצוגת פרטי תיק מלאה
 * מנהלת את תצוגת הנתונים, ציר הזמן, משימות ושיחות.
 */
export class CaseDetailView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  /**
   * פונקציית הרינדור הראשית - טוענת נתונים ומציגה את המבנה
   */
  async render(caseId) {
    console.log("CaseDetailView.render called with caseId:", caseId);
    const container = document.getElementById("view-container");

    if (!container) {
      console.error("view-container not found!");
      return;
    }

    // מצב טעינה
    container.innerHTML = `
      <div style="padding:100px; text-align:center;">
        <div class="spinner" style="margin-bottom:20px;"></div>
        <div style="font-size:1.2rem; color:var(--text-gray);">טוען נתוני תיק...</div>
      </div>
    `;

    try {
      // טעינת הנתונים מה-AppState
      await this.appState.loadCaseById(caseId);
      const c = this.appState.currentCase;

      if (!c) {
        console.warn("Case not found");
        container.innerHTML = `
          <div style="padding:100px; text-align:center;">
            <i class="fas fa-search" style="font-size:48px; color:var(--text-gray); opacity:0.3;"></i>
            <h3 style="margin-top:20px;">תיק לא נמצא</h3>
            <button class="btn-new" onclick="window.navigationManager.backToCases()" style="margin-top:20px;">חזרה לרשימה</button>
          </div>
        `;
        return;
      }

      this.renderContent(c);
    } catch (error) {
      console.error("Error rendering case detail:", error);
      container.innerHTML = `
        <div style="padding:100px; text-align:center;">
          <i class="fas fa-exclamation-triangle" style="font-size:48px; color:#ef4444; margin-bottom:20px;"></i>
          <h3>שגיאה בטעינת התיק</h3>
          <p style="color:#64748b; margin-top:10px;">${error.message}</p>
          <button class="btn-new" onclick="window.navigationManager.backToCases()" style="margin-top:20px;">חזרה לרשימת התיקים</button>
        </div>
      `;
    }
  }

  /**
   * בניית ה-HTML של תוכן התיק
   */
  renderContent(c) {
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim();
    const lawyerNames =
      c.case_lawyers?.map((cl) => cl.lawyer.name).join(", ") || "-";

    // חלוקת אירועים לציר זמן
    const medicalEvents =
      c.timeline_events?.filter((e) => e.event_type === "medical") || [];
    const legalEvents =
      c.timeline_events?.filter((e) => e.event_type === "legal") || [];

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
              <span><strong>תיק משרד:</strong> ${c.case_num}</span>
              <span><strong>ת.א:</strong> ${c.ta_num || "-"}</span>
              <span><strong>נפתח ב:</strong> ${c.open_date || "-"}</span>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items: center;">
            <button class="btn-new" id="btn-merge-docs">
              <i class="far fa-file-pdf"></i> מיזוג והפקת חוברת
            </button>
            <select id="detail-status-select" class="status-select status-${c.status}">
              <option value="open" ${c.status === "open" ? "selected" : ""}>פתוח</option>
              <option value="process" ${c.status === "process" ? "selected" : ""}>בטיפול</option>
              <option value="closed" ${c.status === "closed" ? "selected" : ""}>סגור</option>
            </select>
          </div>
        </div>

        <div class="details-grid">
          <div class="left-col">
            <div class="section-card">
              <div class="section-title">
                <span>ציר זמן רפואי</span>
                <i class="fas fa-heartbeat" style="color:#10b981;"></i>
              </div>
              <div class="timeline-container">
                ${this.renderTimeline(medicalEvents)}
              </div>
            </div>

            <div class="section-card">
              <div class="section-title">
                <span>ציר זמן משפטי</span>
                <i class="fas fa-gavel" style="color:#6366f1;"></i>
              </div>
              <div class="timeline-container">
                ${this.renderTimeline(legalEvents)}
              </div>
            </div>
          </div>

          <div class="right-col">
            <div class="section-card">
              <div class="section-title">פרטי לקוח</div>
              <div class="info-row"><span class="info-label">ת.ז:</span><span class="info-val">${c.tz || "-"}</span></div>
              <div class="info-row"><span class="info-label">קופת חולים:</span><span class="info-val">${c.hmo || "-"}</span></div>
              <div class="info-row"><span class="info-label">טלפון:</span><span class="info-val">${c.phone || "-"}</span></div>
              <div class="info-row"><span class="info-label">כתובת:</span><span class="info-val">${c.street || ""} ${c.city || ""}</span></div>
              <div class="info-row"><span class="info-label">עו"ד מטפל:</span><span class="info-val">${lawyerNames}</span></div>
            </div>

            <div class="section-card">
              <div class="section-title">
                משימות ומעקב
                <span class="counter-badge">${c.case_tasks?.filter((t) => !t.done).length || 0}</span>
              </div>
              <ul class="task-list">
                ${this.renderTasksList(c.case_tasks || [])}
              </ul>
            </div>

            <div class="section-card">
              <div class="section-title">
                תיעוד שיחות
                <span class="counter-badge">${c.case_calls?.length || 0}</span>
              </div>
              <ul class="call-log-list">
                ${this.renderCallsList(c.case_calls || [])}
              </ul>
            </div>

            <div class="section-card">
              <div class="section-title">סטטוס מסמכי ייצוג</div>
              <ul class="docs-status-list">
                ${this.renderDocsList(c.case_documents || [])}
              </ul>
            </div>
          </div>
        </div>

        <button class="chat-bubble-btn" id="chat-bubble-btn" title="שאל את התיק (AI)">
          <i class="fas fa-comment-dots"></i>
        </button>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * חיבור אירועים לאלמנטים ב-DOM לאחר הרינדור
   */
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
          // עדכון צבע הסלקט ללא רינדור מחדש של הכל (אופציונלי)
          e.target.className = `status-select status-${e.target.value}`;
        } catch (err) {
          alert("שגיאה בעדכון הסטטוס");
        }
      });

    document.getElementById("btn-merge-docs")?.addEventListener("click", () => {
      alert("פונקציונליות מיזוג והפקת חוברת - בפיתוח");
    });

    document
      .getElementById("chat-bubble-btn")
      ?.addEventListener("click", () => {
        if (window.chatManager) {
          window.chatManager.openChat();
        } else {
          alert("מערכת ה-Chat לא זמינה כרגע");
        }
      });
  }

  /**
   * עזר לרינדור רשימת משימות
   */
  renderTasksList(tasks) {
    if (!tasks.length) return '<li class="empty-list">אין משימות</li>';
    return tasks
      .map(
        (t) => `
      <li class="task-item task-urgent-${t.urgency || "low"} ${t.done ? "task-done" : ""}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${t.done ? "checked" : ""} onchange="console.log('Task toggled')">
          <div class="task-content">
            <span class="task-text">${t.text}</span>
            ${t.deadline ? `<div class="task-details-row"><span class="task-deadline"><i class="far fa-calendar"></i> ${new Date(t.deadline).toLocaleDateString("he-IL")}</span></div>` : ""}
          </div>
        </div>
      </li>
    `,
      )
      .join("");
  }

  /**
   * עזר לרינדור יומן שיחות
   */
  renderCallsList(calls) {
    if (!calls.length) return '<li class="empty-list">אין שיחות מתועדות</li>';
    return calls
      .slice(0, 5)
      .map(
        (call) => `
      <li class="call-log-item">
        <div class="call-meta">${call.call_date}</div>
        <div class="call-content">${call.content}</div>
      </li>
    `,
      )
      .join("");
  }

  /**
   * עזר לרינדור סטטוס מסמכים
   */
  renderDocsList(docs) {
    if (!docs.length) return '<li class="empty-list">אין מסמכים</li>';
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
          <span class="doc-name">${doc.doc_name}</span>
          <span class="doc-badge ${badge.class}">${badge.text}</span>
        </li>
      `;
      })
      .join("");
  }

  /**
   * עזר לרינדור ציר זמן (משמש גם למדיקלי וגם למשפטי)
   */
  renderTimeline(events) {
    if (!events.length) return '<div class="empty-timeline">אין אירועים</div>';

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
              ${filesHtml ? `<div class="timeline-actions"><div class="attached-files">${filesHtml}</div></div>` : ""}
            </div>
          </div>
        `;
      })
      .join("");
  }
}
