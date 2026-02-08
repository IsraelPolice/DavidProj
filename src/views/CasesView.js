import { casesService } from '../services/cases.service.js';

export class CasesView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
    this.activeFilter = 'all';
  }

  async render() {
    const container = document.getElementById('view-container');
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
    if (window.uiManager) {
      window.uiManager.updateBadges(this.appState.cases);
    }
  }

  attachEventListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.getAttribute('data-filter');
        this.renderCases();
      });
    });

    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', () => this.renderCases());
    searchInput?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.renderCases();
    });

    document.getElementById('btn-new-case')?.addEventListener('click', () => {
      this.showNewCaseModal();
    });
  }

  renderCases() {
    const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';
    const grid = document.getElementById('cases-grid-container');

    let filtered = this.appState.cases.filter(c => {
      const matchesSearch = !searchQuery ||
        c.first_name?.toLowerCase().includes(searchQuery) ||
        c.last_name?.toLowerCase().includes(searchQuery) ||
        c.case_num?.includes(searchQuery) ||
        c.phone?.includes(searchQuery) ||
        c.tz?.includes(searchQuery);

      let matchesFilter = true;
      if (this.activeFilter === 'overdue') {
        const allSigned = c.case_documents?.every(d => d.status === 'signed') ?? true;
        matchesFilter = !allSigned && c.docs_deadline &&
          new Date(c.docs_deadline) < new Date().setHours(0, 0, 0, 0);
      } else if (this.activeFilter !== 'all') {
        matchesFilter = c.status === this.activeFilter;
      }

      return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-gray);">לא נמצאו תיקים</div>';
      return;
    }

    grid.innerHTML = filtered.map(c => {
      const statusClass = c.status === 'process' ? 'status-process' :
        (c.status === 'closed' ? 'status-closed' : 'status-open');
      const statusText = c.status === 'process' ? 'בטיפול' :
        (c.status === 'closed' ? 'סגור' : 'פתוח');

      const allSigned = c.case_documents?.every(d => d.status === 'signed') ?? true;
      const isOverdue = !allSigned && c.docs_deadline &&
        new Date(c.docs_deadline) < new Date().setHours(0, 0, 0, 0);

      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
      const caseTypeName = c.case_type?.name || 'ללא סיווג';

      return `
        <div class="case-card" data-case-id="${c.id}">
          <div class="card-header">
            <span class="status-badge ${statusClass}">${statusText}</span>
            ${isOverdue ? '<span class="status-badge status-overdue" style="margin-right:5px;">⚠️ עיכוב מסמכים</span>' : ''}
          </div>
          <div class="card-title">${fullName}</div>
          <div class="card-subtitle">
            תיק: ${c.case_num}<br>
            <span style="font-size:12px; color:#64748b;">${caseTypeName}</span>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <i class="fas fa-file-alt"></i> ${c.case_documents?.length || 0} מסמכים
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.case-card').forEach(card => {
      card.addEventListener('click', () => {
        const caseId = card.getAttribute('data-case-id');
        this.navigationManager.openCase(caseId);
      });
    });
  }

  showNewCaseModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>פתיחת תיק חדש</h2>
          <button class="modal-close" id="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>שם פרטי *</label>
            <input type="text" id="new-case-first-name" required>
          </div>
          <div class="form-group">
            <label>שם משפחה *</label>
            <input type="text" id="new-case-last-name" required>
          </div>
          <div class="form-group">
            <label>תעודת זהות</label>
            <input type="text" id="new-case-tz">
          </div>
          <div class="form-group">
            <label>טלפון</label>
            <input type="tel" id="new-case-phone">
          </div>
          <div class="form-group">
            <label>סוג תיק *</label>
            <select id="new-case-type" required>
              <option value="">בחר סוג תיק</option>
              ${this.appState.caseTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>עורך דין מטפל *</label>
            <select id="new-case-lawyer" required>
              <option value="">בחר עורך דין</option>
              ${this.appState.lawyers.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
            </select>
          </div>
          <div id="new-case-error" style="color: red; font-size: 14px; margin-top: 10px; display: none;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" id="cancel-new-case">ביטול</button>
          <button class="btn-save" id="save-new-case">שמור תיק</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-new-case').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('save-new-case').addEventListener('click', async () => {
      const firstName = document.getElementById('new-case-first-name').value.trim();
      const lastName = document.getElementById('new-case-last-name').value.trim();
      const tz = document.getElementById('new-case-tz').value.trim();
      const phone = document.getElementById('new-case-phone').value.trim();
      const caseTypeId = document.getElementById('new-case-type').value;
      const lawyerId = document.getElementById('new-case-lawyer').value;
      const errorDiv = document.getElementById('new-case-error');

      if (!firstName || !lastName || !caseTypeId || !lawyerId) {
        errorDiv.textContent = 'נא למלא את כל השדות החובה (*)';
        errorDiv.style.display = 'block';
        return;
      }

      try {
        const btn = document.getElementById('save-new-case');
        btn.disabled = true;
        btn.textContent = 'שומר...';
        errorDiv.style.display = 'none';

        const caseNum = await casesService.getNextCaseNumber();
        const today = new Date();
        const openDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        const deadlineDate = new Date(today);
        deadlineDate.setDate(deadlineDate.getDate() + 14);

        await this.appState.createCase({
          caseNum: caseNum,
          firstName: firstName,
          lastName: lastName,
          tz: tz || null,
          phone: phone || null,
          caseTypeId: caseTypeId,
          lawyerIds: [lawyerId],
          openDate: openDate,
          docsDeadline: deadlineDate.toISOString().split('T')[0]
        });

        closeModal();
        await this.renderCases();
        if (window.uiManager) {
          window.uiManager.updateBadges(this.appState.cases);
        }
      } catch (error) {
        console.error('Failed to create case:', error);
        errorDiv.textContent = 'שגיאה ביצירת התיק. נסה שוב.';
        errorDiv.style.display = 'block';

        const btn = document.getElementById('save-new-case');
        btn.disabled = false;
        btn.textContent = 'שמור תיק';
      }
    });
  }
}
