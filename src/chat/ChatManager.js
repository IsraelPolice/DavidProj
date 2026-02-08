import { chatService } from '../services/chat.service.js';

export class ChatManager {
  constructor(appState) {
    this.appState = appState;
    this.currentCaseId = null;
    this.subscription = null;
  }

  async openChat(caseId) {
    if (!caseId) {
      console.error('No caseId provided to openChat');
      return;
    }

    this.currentCaseId = caseId;

    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) {
      console.error('Chat window not found in DOM');
      return;
    }

    try {
      await this.loadMessages();
      this.attachEventListeners();
      this.setupSubscription();
      this.showChat();
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  }

  closeChat() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentCaseId = null;
    this.hideChat();
  }

  async loadMessages() {
    try {
      const messages = await chatService.getMessagesByCase(this.currentCaseId);
      this.renderMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.renderError();
    }
  }

  renderMessages(messages) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    if (messages.length === 0) {
      chatBody.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-gray);">אין הודעות עדיין</div>';
      return;
    }

    chatBody.innerHTML = messages.map(msg => {
      const isClient = msg.sender === 'client';
      const time = new Date(msg.sent_at).toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="msg-bubble ${isClient ? 'msg-client' : 'msg-lawyer'}">
          <div class="msg-text">${msg.message}</div>
          <div class="msg-time">${time}</div>
        </div>
      `;
    }).join('');

    chatBody.scrollTop = chatBody.scrollHeight;
  }

  renderError() {
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = '<div style="padding:20px; text-align:center; color:red;">שגיאה בטעינת ההודעות</div>';
    }
  }

  attachEventListeners() {
    const sendBtn = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatToggle = document.getElementById('chat-header-toggle');

    if (sendBtn) {
      sendBtn.onclick = () => this.sendMessage();
    }

    if (chatInput) {
      chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      };
    }

    if (chatToggle) {
      chatToggle.onclick = () => this.toggleChat();
    }
  }

  async sendMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) return;

    try {
      await chatService.sendMessage(this.currentCaseId, 'lawyer', message);
      chatInput.value = '';
      await this.loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('שגיאה בשליחת ההודעה');
    }
  }

  setupSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = chatService.subscribeToMessages(this.currentCaseId, () => {
      this.loadMessages();
    });
  }

  showChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.style.display = 'flex';
      chatWindow.classList.remove('minimized');
    }
  }

  hideChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.style.display = 'none';
    }
  }

  toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    const toggleIcon = document.getElementById('chat-toggle-icon');

    if (chatWindow) {
      chatWindow.classList.toggle('minimized');

      if (toggleIcon) {
        if (chatWindow.classList.contains('minimized')) {
          toggleIcon.className = 'fas fa-chevron-up';
        } else {
          toggleIcon.className = 'fas fa-chevron-down';
        }
      }
    }
  }
}
