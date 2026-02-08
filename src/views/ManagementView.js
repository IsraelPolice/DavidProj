import { lawyersService } from '../services/lawyers.service.js';
import { caseTypesService } from '../services/caseTypes.service.js';
import { templatesService } from '../services/templates.service.js';
import { officeService } from '../services/office.service.js';

export class ManagementView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="management-view">
        <div class="top-bar">
          <h1 class="page-title">ניהול מערכת והגדרות</h1>
        </div>
        <div class="mgmt-grid">
          <div class="mgmt-card">
            <div class="section-title">ניהול עורכי דין</div>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
              <input type="text" id="new-lawyer-name" placeholder="שם העו״ד..." style="padding:8px; border-radius:4px; border:1px solid #ccc; flex:1;">
              <button class="btn-save" id="btn-add-lawyer" style="padding:8px 15px;">הוסף</button>
            </div>
            <ul class="list-group" id="mgmt-lawyers-list"></ul>
          </div>
          <div class="mgmt-card">
            <div class="section-title">ניהול סוגי תיקים</div>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
              <input type="text" id="new-type-name" placeholder="סוג תיק חדש..." style="padding:8px; border-radius:4px; border:1px solid #ccc; flex:1;">
              <button class="btn-save" id="btn-add-type" style="padding:8px 15px;">הוסף</button>
            </div>
            <ul class="list-group" id="mgmt-types-list"></ul>
          </div>
          <div class="mgmt-card" style="grid-column: 1/-1;">
            <div class="section-title">
              תבניות ציר רפואי (Workflows)
              <button class="btn-new" id="btn-new-template" style="font-size:12px; padding:5px 10px;">+ חדש</button>
            </div>
            <p style="font-size:13px; color:var(--text-gray); margin-bottom:10px;">לחץ על התבנית לצפייה בשלבים.</p>
            <ul class="list-group" id="mgmt-templates-list"></ul>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.renderLawyers();
    await this.renderCaseTypes();
    await this.renderTemplates();
  }

  attachEventListeners() {
    document.getElementById('btn-add-lawyer')?.addEventListener('click', async () => {
      const name = document.getElementById('new-lawyer-name').value.trim();
      if (name) {
        await this.appState.addLawyer(name);
        document.getElementById('new-lawyer-name').value = '';
        this.renderLawyers();
      }
    });

    document.getElementById('btn-add-type')?.addEventListener('click', async () => {
      const name = document.getElementById('new-type-name').value.trim();
      if (name) {
        await this.appState.addCaseType(name);
        document.getElementById('new-type-name').value = '';
        this.renderCaseTypes();
      }
    });

    document.getElementById('btn-new-template')?.addEventListener('click', () => {
      alert('יצירת תבנית חדשה - בפיתוח');
    });
  }

  async renderLawyers() {
    const list = document.getElementById('mgmt-lawyers-list');
    try {
      const lawyers = await lawyersService.getAllLawyers();
      list.innerHTML = lawyers.map(l => `
        <li class="list-group-item">
          <span>${l.name}</span>
          <button class="btn-danger" data-id="${l.id}">
            <i class="fas fa-trash"></i>
          </button>
        </li>
      `).join('');

      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('למחוק עורך דין זה?')) {
            await this.appState.deleteLawyer(btn.getAttribute('data-id'));
            await this.renderLawyers();
          }
        });
      });
    } catch (error) {
      console.error('Failed to load lawyers:', error);
      list.innerHTML = '<li style="padding:10px; color:red;">שגיאה בטעינת עורכי דין</li>';
    }
  }

  async renderCaseTypes() {
    const list = document.getElementById('mgmt-types-list');
    try {
      const caseTypes = await caseTypesService.getAllCaseTypes();
      list.innerHTML = caseTypes.map(t => `
        <li class="list-group-item">
          <span>${t.name}</span>
          <button class="btn-danger" data-id="${t.id}">
            <i class="fas fa-trash"></i>
          </button>
        </li>
      `).join('');

      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('למחוק סוג תיק זה?')) {
            await this.appState.deleteCaseType(btn.getAttribute('data-id'));
            await this.renderCaseTypes();
          }
        });
      });
    } catch (error) {
      console.error('Failed to load case types:', error);
      list.innerHTML = '<li style="padding:10px; color:red;">שגיאה בטעינת סוגי תיקים</li>';
    }
  }

  async renderTemplates() {
    const list = document.getElementById('mgmt-templates-list');
    try {
      const templates = await templatesService.getAllTemplates();
      list.innerHTML = templates.map(t => `
        <li class="template-item">
          <div class="template-header">
            <div class="template-info">
              <strong>${t.name}</strong><br>
              <span style="font-size:12px; color:#64748b;">${t.template_steps?.length || 0} שלבים</span>
            </div>
            <div class="template-actions">
              <button class="btn-edit-action" data-id="${t.id}">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button class="btn-danger" data-id="${t.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </li>
      `).join('');

      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('למחוק תבנית זו?')) {
            await this.appState.deleteTemplate(btn.getAttribute('data-id'));
            await this.renderTemplates();
          }
        });
      });
    } catch (error) {
      console.error('Failed to load templates:', error);
      list.innerHTML = '<li style="padding:10px; color:red;">שגיאה בטעינת תבניות</li>';
    }
  }
}
