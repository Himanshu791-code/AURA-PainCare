/**
 * AURA-PainCare: Dynamic QR Code Manager
 * Enables instant mobile access and live QR code regeneration.
 */

class QRManager {
  constructor() {
    this.modal = null;
    this.qrContainer = null;
    this.urlInput = null;
    this.qrInstance = null;
    this.defaultIp = '10.90.169.160';
    this.port = 8000;
  }

  init() {
    this.modal = document.getElementById('qr-code-modal');
    this.qrContainer = document.getElementById('dynamic-qr-container');
    this.urlInput = document.getElementById('qr-url-input');

    const openBtn = document.getElementById('qr-modal-btn');
    const closeBtn = document.getElementById('qr-modal-close-btn');
    const copyBtn = document.getElementById('qr-copy-link-btn');

    // Auto-detect URL from browser location
    let targetUrl = '';
    const host = window.location.hostname;
    const port = window.location.port || '8000';
    
    if (host && host !== '127.0.0.1' && host !== 'localhost' && host !== '') {
      targetUrl = `${window.location.protocol}//${host}:${port}/index.html`;
    } else {
      targetUrl = `http://${this.defaultIp}:${port}/index.html`;
    }

    if (this.urlInput) {
      this.urlInput.value = targetUrl;
      this.urlInput.addEventListener('input', (e) => {
        this.updateQR(e.target.value.trim());
      });
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyUrl());
    }

    // Render initial QR
    this.updateQR(targetUrl);
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add('active');
      if (this.urlInput) {
        this.updateQR(this.urlInput.value);
      }
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  updateQR(text) {
    if (!this.qrContainer || !text) return;
    this.qrContainer.innerHTML = '';

    if (window.QRCode) {
      try {
        this.qrInstance = new window.QRCode(this.qrContainer, {
          text: text,
          width: 220,
          height: 220,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H
        });
      } catch (err) {
        console.warn('[QRManager] QRCode render error:', err);
        this.renderFallbackImg();
      }
    } else {
      this.renderFallbackImg();
    }
  }

  renderFallbackImg() {
    if (!this.qrContainer) return;
    this.qrContainer.innerHTML = '<img src="qr_code.png" style="width:220px;height:220px;display:block;" alt="QR Code">';
  }

  copyUrl() {
    if (!this.urlInput) return;
    const url = this.urlInput.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        const isHi = window.translator && window.translator.currentLang === 'hi';
        const msg = isHi ? '✓ लिंक क्लिपबोर्ड पर कॉपी हो गया!' : '✓ Link copied to clipboard!';
        if (window.nurseDashboard && window.nurseDashboard.showToast) {
          window.nurseDashboard.showToast(msg);
        } else {
          alert(msg);
        }
      }).catch(() => {
        this.urlInput.select();
        document.execCommand('copy');
        alert('✓ Link copied!');
      });
    } else {
      this.urlInput.select();
      document.execCommand('copy');
      alert('✓ Link copied!');
    }
  }
}

window.qrManager = new QRManager();
