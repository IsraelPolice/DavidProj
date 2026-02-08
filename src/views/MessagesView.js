export class MessagesView {
  constructor(appState, navigationManager) {
    this.appState = appState;
    this.navigationManager = navigationManager;
  }

  render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div id="messages-view">
        <div class="top-bar">
          <h1 class="page-title">הודעות אחרונות מלקוחות</h1>
        </div>
        <div class="msg-grid" id="msg-grid-container"></div>
      </div>
    `;

    this.renderMessages();
  }

  renderMessages() {
    const grid = document.getElementById('msg-grid-container');
    const valid = this.appState.cases.filter(c =>
      c.chat_messages && c.chat_messages.length > 0
    );

    if (valid.length === 0) {
      grid.innerHTML = '<div style="padding:20px; color:var(--text-gray);">אין הודעות</div>';
      return;
    }

    grid.innerHTML = valid.map(c => {
      const last = c.chat_messages[c.chat_messages.length - 1];
      const time = new Date(last.sent_at).toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="msg-card" data-case-id="${c.id}">
          <div class="msg-card-header">
            <span class="msg-client-name">${c.first_name} ${c.last_name}</span>
            <span class="msg-time">${time}</span>
          </div>
          <div class="msg-preview">${last.message}</div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.msg-card').forEach(card => {
      card.addEventListener('click', () => {
        const caseId = card.getAttribute('data-case-id');
        this.navigationManager.openCase(caseId);
      });
    });
  }
}
