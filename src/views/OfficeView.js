import { officeService } from '../services/office.service.js';
import { lawyersService } from '../services/lawyers.service.js';
import { authService } from '../services/auth.service.js';

export class OfficeView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="office-view">
        <div class="top-bar">
          <h1 class="page-title">ניהול המשרד שלי</h1>
        </div>
        <div class="office-content">
          <div class="section-card">
            <div class="section-title">עורכי דין במשרד</div>
            <p style="font-size:13px; color:var(--text-gray); margin-bottom:15px;">
              עורכי הדין המשויכים למשרד שלך ולקוחותיהם
            </p>
            <div id="lawyers-list-container"></div>
          </div>

          <div class="section-card">
            <div class="section-title">הוספת עורך דין חדש</div>
            <p style="font-size:13px; color:var(--text-gray); margin-bottom:15px;">
              צור משתמש חדש לעורך דין במשרד
            </p>
            <div style="display:flex; flex-direction:column; gap:15px;">
              <div class="form-group">
                <label>שם העורך דין</label>
                <input type="text" id="new-lawyer-name" placeholder="שם מלא" style="padding:10px; border-radius:4px; border:1px solid #ccc; width:100%;">
              </div>
              <div class="form-group">
                <label>אימייל</label>
                <input type="email" id="new-lawyer-email" placeholder="email@example.com" style="padding:10px; border-radius:4px; border:1px solid #ccc; width:100%;">
              </div>
              <div class="form-group">
                <label>סיסמה זמנית</label>
                <input type="password" id="new-lawyer-password" placeholder="סיסמה (לפחות 6 תווים)" style="padding:10px; border-radius:4px; border:1px solid #ccc; width:100%;">
              </div>
              <button class="btn-save" id="btn-add-office-lawyer" style="padding:10px 20px;">הוסף עורך דין</button>
              <div id="add-lawyer-error" style="color:red; font-size:13px; display:none;"></div>
              <div id="add-lawyer-success" style="color:green; font-size:13px; display:none;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.renderLawyersList();
  }

  attachEventListeners() {
    document.getElementById('btn-add-office-lawyer')?.addEventListener('click', () => {
      this.addNewLawyer();
    });
  }

  async renderLawyersList() {
    const container = document.getElementById('lawyers-list-container');

    try {
      const profile = window.currentProfile;
      if (!profile || !profile.office_id) {
        container.innerHTML = '<p style="color:var(--text-gray); padding:20px;">אין משרד משוייך</p>';
        return;
      }

      const officeData = await officeService.getOfficeWithMembers(profile.office_id);

      if (!officeData || !officeData.members || officeData.members.length === 0) {
        container.innerHTML = '<p style="color:var(--text-gray); padding:20px;">אין עורכי דין במשרד</p>';
        return;
      }

      const lawyersWithCases = await Promise.all(
        officeData.members.map(async (member) => {
          const cases = this.appState.cases.filter(c =>
            c.case_lawyers?.some(cl => cl.lawyer_id === member.lawyer.id)
          );

          return {
            lawyer: member.lawyer,
            casesCount: cases.length
          };
        })
      );

      container.innerHTML = `
        <div class="lawyers-grid">
          ${lawyersWithCases.map(item => `
            <div class="lawyer-card">
              <div class="lawyer-header">
                <div class="lawyer-avatar-large">${item.lawyer.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <div class="lawyer-info">
                  <h3>${item.lawyer.name}</h3>
                  <span style="font-size:13px; color:var(--text-gray);">עורך דין</span>
                </div>
              </div>
              <div class="lawyer-stats">
                <div class="stat-item">
                  <i class="fas fa-folder-open"></i>
                  <span>${item.casesCount} תיקים</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load lawyers list:', error);
      container.innerHTML = '<p style="color:red; padding:20px;">שגיאה בטעינת רשימת עורכי הדין</p>';
    }
  }

  async addNewLawyer() {
    const nameInput = document.getElementById('new-lawyer-name');
    const emailInput = document.getElementById('new-lawyer-email');
    const passwordInput = document.getElementById('new-lawyer-password');
    const errorDiv = document.getElementById('add-lawyer-error');
    const successDiv = document.getElementById('add-lawyer-success');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (!name || !email || !password) {
      errorDiv.textContent = 'נא למלא את כל השדות';
      errorDiv.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים';
      errorDiv.style.display = 'block';
      return;
    }

    const btn = document.getElementById('btn-add-office-lawyer');
    btn.disabled = true;
    btn.textContent = 'מוסיף...';

    try {
      const profile = window.currentProfile;
      if (!profile || !profile.office_id) {
        throw new Error('אין משרד משוייך');
      }

      await officeService.addLawyerToOffice(profile.office_id, name, email, password);

      successDiv.textContent = 'עורך הדין נוסף בהצלחה! הוא יכול להתחבר עם האימייל והסיסמה שהוזנו.';
      successDiv.style.display = 'block';

      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';

      await this.appState.loadInitialData();
      await this.renderLawyersList();
    } catch (error) {
      console.error('Failed to add lawyer:', error);
      errorDiv.textContent = 'שגיאה בהוספת עורך הדין: ' + (error.message || 'נסה שוב מאוחר יותר');
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'הוסף עורך דין';
    }
  }
}
