import { casesService } from "../services/cases.service.js";

export class CasesView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
    this.activeFilter = "all";
  }

  async render() {
    const container = document.getElementById("view-container");
    container.innerHTML = `
      <div id="cases-list-view">
        <div class="top-bar">
          <h1 class="page-title">ניהול תיקים</h1>
          <div class="search-box">
            <input type="text" id="search-input" placeholder="חיפוש לפי שם, ת.ז, מס' תיק, טלפון...">
            <i class="fas fa-search"></i>
          </div>
          <button class="btn-new" id="btn-new-case">
            <i class="fas fa-plus"></i> פתיחת תיק חדש
          </button>
        </div>
        <div class="filter-bar">
          <button class="filter-btn active" data-filter="all">הכל</button>
          <button class="filter-btn" data-filter="open">פתוח</button>
          <button class="filter-btn" data-filter="process">בטיפול</button>
          <button class="filter-btn" data-filter="closed">סגור</button>
          <button class="filter-btn alert" data-filter="overdue">
            <i class="fas fa-exclamation-triangle"></i> עיכוב מסמכים
          </button>
        </div>
        <div class="cases-grid" id="cases-grid-container"></div>
      </div>
    `;

    this.attachEventListeners();
    this.renderCases();
  }

  attachEventListeners() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.activeFilter = e.target.getAttribute("data-filter");
        this.renderCases();
      });
    });

    const searchInput = document.getElementById("search-input");
    searchInput?.addEventListener("input", () => this.renderCases());

    document.getElementById("btn-new-case")?.addEventListener("click", () => {
      this.showNewCaseModal();
    });
  }

  renderCases() {
    const searchQuery =
      document.getElementById("search-input")?.value.toLowerCase() || "";
    const grid = document.getElementById("cases-grid-container");

    let filtered = this.appState.cases.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.first_name?.toLowerCase().includes(searchQuery) ||
        c.last_name?.toLowerCase().includes(searchQuery) ||
        c.case_num?.includes(searchQuery);

      let matchesFilter =
        this.activeFilter === "all" || c.status === this.activeFilter;
      return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-gray);">לא נמצאו תיקים</div>';
      return;
    }

    grid.innerHTML = filtered
      .map(
        (c) => `
        <div class="case-card" data-case-id="${c.id}">
          <div class="card-header">
            <span class="status-badge status-${c.status}">${c.status}</span>
          </div>
          <div class="card-title">${c.first_name} ${c.last_name}</div>
          <div class="card-subtitle">תיק: ${c.case_num}</div>
        </div>
      `,
      )
      .join("");

    document.querySelectorAll(".case-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.navigationManager.openCase(card.getAttribute("data-case-id"));
      });
    });
  }

  showNewCaseModal() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header"><h2>פתיחת תיק חדש</h2></div>
        <div class="modal-body">
          <div class="form-group"><label>שם פרטי *</label><input type="text" id="new-case-first-name"></div>
          <div class="form-group"><label>שם משפחה *</label><input type="text" id="new-case-last-name"></div>
          <div class="form-group">
            <label>סוג תיק *</label>
            <select id="new-case-type">
              <option value="">בחר סוג</option>
              ${this.appState.caseTypes.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>עורך דין *</label>
            <select id="new-case-lawyer">
              <option value="">בחר עו"ד</option>
              ${this.appState.lawyers.map((l) => `<option value="${l.id}">${l.full_name || l.name}</option>`).join("")}
            </select>
          </div>
          <div id="new-case-error" style="color:red; display:none; margin-top:10px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" id="close-modal">ביטול</button>
          <button class="btn-save" id="save-new-case">שמור תיק</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-modal").onclick = () => modal.remove();

    document.getElementById("save-new-case").onclick = async () => {
      const firstName = document.getElementById("new-case-first-name").value;
      const lastName = document.getElementById("new-case-last-name").value;
      const caseTypeId = document.getElementById("new-case-type").value;
      const lawyerId = document.getElementById("new-case-lawyer").value;

      if (!firstName || !lastName || !caseTypeId || !lawyerId) {
        document.getElementById("new-case-error").textContent =
          "חובה למלא שדות מסומנים";
        document.getElementById("new-case-error").style.display = "block";
        return;
      }

      try {
        const btn = document.getElementById("save-new-case");
        btn.disabled = true;
        btn.textContent = "שומר...";

        // קריאה ל-Service - כאן קרתה השגיאה קודם
        const nextNum = await casesService.getNextCaseNumber();

        const today = new Date();
        const openDate = today.toLocaleDateString("he-IL");

        await this.appState.createCase({
          caseNum: nextNum,
          firstName,
          lastName,
          caseTypeId,
          lawyerIds: [lawyerId],
          openDate,
          docsDeadline: new Date(
            today.setDate(today.getDate() + 14),
          ).toISOString(),
        });

        modal.remove();
        this.renderCases();
      } catch (err) {
        console.error(err);
        document.getElementById("new-case-error").textContent =
          "שגיאה ביצירת התיק";
        document.getElementById("new-case-error").style.display = "block";
        document.getElementById("save-new-case").disabled = false;
      }
    };
  }
}
