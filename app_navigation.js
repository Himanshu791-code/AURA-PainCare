/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Multi-View Slide Navigator, ICU Ward Grid & Non-Verbal Communication Board Controller
 */

class AppNavigationManager {
  constructor() {
    this.currentTab = 'bedside';
    this.selectedPatientIndex = 0; // Default Bed 104
    this.currentDeckSlide = 1;
    this.totalDeckSlides = 7; // Expanded to 7 slides for Vigyan Mela
    this.wardFilter = 'all';
  }

  init() {
    // Bind Top Nav Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Keyboard hotkeys: 1-5 for tabs, F for fullscreen deck, Arrows for slides
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const tabs = ['bedside', 'ward', 'bodymap', 'registry', 'deck'];
        this.switchTab(tabs[parseInt(e.key) - 1]);
      } else if (this.currentTab === 'deck') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          this.changeDeckSlide(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          this.changeDeckSlide(-1);
        } else if (e.key.toLowerCase() === 'f') {
          this.toggleFullscreenDeck();
        }
      }
    });

    // Ward filter chips
    document.querySelectorAll('.ward-filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const filter = e.currentTarget.getAttribute('data-filter');
        this.filterWardBeds(filter);
      });
    });

    // Fullscreen Deck Button
    const fsBtn = document.getElementById('deck-fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreenDeck());
    }

    // Render Initial Dynamic Data
    this.renderWardGrid();
    this.renderRegistryList();
    this.renderPatientDetail(0);
    this.bindNonVerbalCards();
    this.bindSlideDeckControls();
  }

  filterWardBeds(filterType) {
    this.wardFilter = filterType;
    document.querySelectorAll('.ward-filter-chip').forEach(c => {
      if (c.getAttribute('data-filter') === filterType) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    this.renderWardGrid();
  }

  toggleFullscreenDeck() {
    const deckEl = document.getElementById('view-deck');
    const fsBtn = document.getElementById('deck-fullscreen-btn');
    const isHi = window.translator && window.translator.currentLang === 'hi';
    if (!document.fullscreenElement) {
      if (deckEl.requestFullscreen) deckEl.requestFullscreen();
      else if (deckEl.webkitRequestFullscreen) deckEl.webkitRequestFullscreen();
      if (fsBtn) fsBtn.innerText = isHi ? '🗗 फुलस्क्रीन से बाहर निकलें' : '🗗 Exit Fullscreen';
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      if (fsBtn) fsBtn.innerText = isHi ? '⛶ फुलस्क्रीन प्रेजेंटेशन' : '⛶ Fullscreen Presentation';
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(b => {
      if (b.getAttribute('data-tab') === tabName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Toggle Content Views
    document.querySelectorAll('.view-section').forEach(sec => {
      if (sec.id === `view-${tabName}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Resize graphs if switching to bedside view
    if (tabName === 'bedside' && window.nurseDashboard) {
      window.nurseDashboard.resizeCanvas();
    }

    // Refresh voice assistant UI when switching to bodymap tab
    if (tabName === 'bodymap' && window.voiceAssistant) {
      window.voiceAssistant.updateUIState();
    }
  }

  /**
   * Render Multi-Bed ICU Ward Grid (7 Beds)
   */
  renderWardGrid() {
    const gridContainer = document.getElementById('ward-beds-grid');
    if (!gridContainer || !window.PATIENT_WARD_DATABASE) return;

    const isHi = window.translator && window.translator.currentLang === 'hi';

    // Filter patients while preserving original database index
    const indexedPatients = window.PATIENT_WARD_DATABASE.map((p, originalIdx) => ({ p, originalIdx }));
    const filtered = indexedPatients.filter(({ p }) => {
      if (this.wardFilter === 'critical') return p.painScore >= 8.5;
      if (this.wardFilter === 'severe') return p.painScore >= 6.0 && p.painScore < 8.5;
      if (this.wardFilter === 'moderate') return p.painScore >= 3.0 && p.painScore < 6.0;
      return true; // 'all'
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        ${isHi ? 'इस श्रेणी में कोई मरीज नहीं है' : 'No patients found in this triage filter category.'}
      </div>`;
      return;
    }

    gridContainer.innerHTML = filtered.map(({ p, originalIdx }) => {
      const isCritical = p.painScore >= 8.5;
      const isSevere = p.painScore >= 6.0 && p.painScore < 8.5;
      const isModerate = p.painScore >= 3.0 && p.painScore < 6.0;

      let badgeClass = 'status-mild';
      let badgeText = isHi ? 'सामान्य' : 'ROUTINE';
      let cardBorder = 'border-mild';

      if (isCritical) {
        badgeClass = 'status-critical-pulse';
        badgeText = isHi ? 'अति गंभीर अलर्ट' : 'CRITICAL ALERT';
        cardBorder = 'border-critical';
      } else if (isSevere) {
        badgeClass = 'status-severe';
        badgeText = isHi ? 'तीव्र दर्द अलर्ट' : 'HIGH PAIN ALERT';
        cardBorder = 'border-severe';
      } else if (isModerate) {
        badgeClass = 'status-moderate';
        badgeText = isHi ? 'मध्यम अवलोकन' : 'OBSERVATION';
        cardBorder = 'border-moderate';
      }

      const displayName = isHi ? p.nameHi : p.name;
      const displayDiag = isHi ? p.diagnosisHi : p.diagnosis;
      const displaySite = isHi ? p.painSiteHi : p.painSite;

      return `
        <div class="ward-bed-card ${cardBorder} ${p.isLiveFeed ? 'live-cam-bed' : ''}">
          <div class="ward-card-header">
            <div class="ward-bed-number">
              <span>BED</span> <strong>${p.bed}</strong>
              ${p.isLiveFeed ? `<span class="live-pill">● LIVE CAM</span>` : ''}
            </div>
            <span class="ward-badge ${badgeClass}">${badgeText}</span>
          </div>

          <div class="ward-patient-name">${displayName} (${p.age}y, ${p.gender})</div>
          <div class="ward-patient-diag">${displayDiag}</div>

          <div class="ward-pain-row">
            <div>
              <div class="ward-metric-title">PAIN INDEX</div>
              <div class="ward-pain-val" id="ward-bed-${p.bed}-pain">${p.painScore.toFixed(1)} <small>/ 10</small></div>
            </div>
            <div style="text-align: right;">
              <div class="ward-metric-title">TARGET SITE</div>
              <div class="ward-site-val">${displaySite}</div>
            </div>
          </div>

          <!-- Mini Telemetry Strip -->
          <div class="ward-vitals-strip">
            <span>HR: <strong>${p.vitals.hr}</strong> bpm</span>
            <span>BP: <strong>${p.vitals.bp}</strong></span>
            <span>SpO2: <strong>${p.vitals.spo2}%</strong></span>
          </div>

          <div class="ward-card-actions">
            <button class="btn btn-secondary btn-sm" style="flex: 1; font-size: 0.72rem;" onclick="window.appNav.inspectPatient(${originalIdx})">
              📋 ${isHi ? 'केस फाइल देखें' : 'View Case Chart'}
            </button>
            <button class="btn btn-secondary btn-sm" style="font-size: 0.72rem;" onclick="window.medicalAlarm.broadcastUrgentVoiceAlert('${p.bed}', '${displayName}')">
              📢 ${isHi ? 'आवाज अलर्ट' : 'Voice Call'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Non-Verbal ICU Communication Cards
   */
  bindNonVerbalCards() {
    document.querySelectorAll('.comm-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const item = e.currentTarget;
        const msgEn = item.getAttribute('data-msg-en');
        const msgHi = item.getAttribute('data-msg-hi');
        const cardTitleEn = item.querySelector('.comm-title-en') ? item.querySelector('.comm-title-en').innerText : '';
        const cardTitleHi = item.querySelector('.comm-title-hi') ? item.querySelector('.comm-title-hi').innerText : '';
        const icon = item.querySelector('.comm-icon') ? item.querySelector('.comm-icon').innerText : '🗣️';

        // Visual flash feedback
        item.classList.add('flash-active', 'voice-matched-card');
        setTimeout(() => item.classList.remove('flash-active', 'voice-matched-card'), 1200);

        // Update voice transcript HUD display
        const transcriptEl = document.getElementById('voice-transcript-text');
        if (transcriptEl) {
          const isHi = window.translator && window.translator.currentLang === 'hi';
          transcriptEl.innerHTML = `
            <div class="matched-voice-pill">
              <span class="matched-icon">${icon}</span>
              <span class="matched-text">
                <strong>${isHi ? '[टच / वॉयस कॉल]:' : '[Touch/Voice Call]:'}</strong> 
                <span class="matched-highlight">${isHi ? cardTitleHi : cardTitleEn}</span>
              </span>
            </div>
          `;
        }

        // Speak aloud in Indian English followed by Hindi
        if (window.medicalAlarm) {
          window.medicalAlarm.speakPatientRequest(msgEn, msgHi);
        }

        // Show Toast Notification
        this.showToast(`📢 Patient Non-Verbal Call: "${window.translator && window.translator.currentLang === 'hi' ? msgHi : msgEn}"`);

        // Log to Nurse Station
        if (window.nurseDashboard) {
          window.nurseDashboard.logIncident(8.0, 'PATIENT_REQUEST: ' + msgEn);
        }
      });
    });
  }

  showToast(text) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /**
   * Render Clinical Registry Explorer (View 4)
   */
  renderRegistryList() {
    const listContainer = document.getElementById('registry-patient-list');
    if (!listContainer || !window.PATIENT_WARD_DATABASE) return;

    const isHi = window.translator && window.translator.currentLang === 'hi';

    listContainer.innerHTML = window.PATIENT_WARD_DATABASE.map((p, idx) => {
      const displayName = isHi ? p.nameHi : p.name;
      const isSelected = idx === this.selectedPatientIndex ? 'selected' : '';

      return `
        <div class="registry-item ${isSelected}" onclick="window.appNav.renderPatientDetail(${idx})">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #38bdf8;">Bed ${p.bed} • ${displayName}</strong>
            <span class="hud-tag" style="font-size: 0.68rem;">Score: ${p.painScore}/10</span>
          </div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 2px;">${p.admissionId} • ${p.ward}</div>
        </div>
      `;
    }).join('');
  }

  inspectPatient(index) {
    this.selectedPatientIndex = index;
    this.switchTab('registry');
    this.renderRegistryList();
    this.renderPatientDetail(index);
  }

  renderPatientDetail(index) {
    this.selectedPatientIndex = index;
    this.renderRegistryList();

    const p = window.PATIENT_WARD_DATABASE[index];
    const detailContainer = document.getElementById('patient-chart-content');
    if (!detailContainer || !p) return;

    const isHi = window.translator && window.translator.currentLang === 'hi';
    const displayName = isHi ? p.nameHi : p.name;
    const displayDiag = isHi ? p.diagnosisHi : p.diagnosis;
    const displayReason = isHi ? p.nonVerbalReasonHi : p.nonVerbalReason;
    const displaySite = isHi ? p.painSiteHi : p.painSite;

    detailContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(55, 65, 81, 0.6); padding-bottom: 12px; margin-bottom: 14px;">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #f3f4f6;">${displayName}</h2>
          <p style="font-size: 0.8rem; color: #9ca3af;">
            Admission ID: <strong>${p.admissionId}</strong> | ${p.ward} | Admitted: ${p.admissionDate}
          </p>
        </div>
        <div style="text-align: right;">
          <span class="status-pill bed-badge" style="font-size: 0.85rem;">Bed ${p.bed}</span>
          <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">Attending: ${p.doctor}</div>
        </div>
      </div>

      <!-- Clinical Demographics Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
        <div class="biomarker-item">
          <div class="biomarker-label-row"><span>Diagnosis</span></div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #fca5a5;">${displayDiag}</div>
        </div>
        <div class="biomarker-item">
          <div class="biomarker-label-row"><span>Non-Verbal Etiology</span></div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #93c5fd;">${displayReason}</div>
        </div>
        <div class="biomarker-item">
          <div class="biomarker-label-row"><span>Active Pain Locus</span></div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #f87171;">${displaySite}</div>
        </div>
      </div>

      <!-- Hemodynamic Vitals Strip -->
      <div class="vitals-grid" style="margin-bottom: 16px;">
        <div class="vital-box">
          <div class="vital-title">Heart Rate</div>
          <div class="vital-value-row">${p.vitals.hr} <span class="vital-unit">BPM</span></div>
        </div>
        <div class="vital-box">
          <div class="vital-title">Blood Pressure</div>
          <div class="vital-value-row">${p.vitals.bp} <span class="vital-unit">mmHg</span></div>
        </div>
        <div class="vital-box">
          <div class="vital-title">Oxygen Saturation</div>
          <div class="vital-value-row">${p.vitals.spo2}% <span class="vital-unit">SpO2</span></div>
        </div>
      </div>

      <!-- Prescribed Analgesia & Medications Table -->
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 0.85rem; font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">
          Prescribed Analgesics & Pain Management Protocol
        </h4>
        <table class="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Medication & Dose</th>
              <th>Route</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${p.medications.map(m => `
              <tr>
                <td>${m.time}</td>
                <td><strong>${m.drug}</strong></td>
                <td>${m.route}</td>
                <td style="color: ${m.status.includes('Administered') ? '#34d399' : '#f59e0b'};">${m.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Past Facial Distress Incidents -->
      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; color: #e5e7eb; margin-bottom: 8px;">
          Autonomous FACS Pain Dispatch Log
        </h4>
        <table class="log-table">
          <thead>
            <tr>
              <th>Incident Time</th>
              <th>Score</th>
              <th>Target Site</th>
              <th>Biomarker Trigger</th>
              <th>Nurse Response</th>
            </tr>
          </thead>
          <tbody>
            ${p.incidents.map(inc => `
              <tr>
                <td>${inc.time}</td>
                <td><strong style="color: #ef4444;">${inc.score}</strong></td>
                <td>${inc.site}</td>
                <td>${inc.trigger}</td>
                <td style="color: #34d399;">${inc.response}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Interactive Slide Deck Controller (View 5)
   */
  bindSlideDeckControls() {
    const prevBtn = document.getElementById('deck-prev-btn');
    const nextBtn = document.getElementById('deck-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.changeDeckSlide(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.changeDeckSlide(1));
    }

    document.querySelectorAll('.deck-dot').forEach((dot, idx) => {
      dot.addEventListener('click', () => this.setDeckSlide(idx + 1));
    });
  }

  changeDeckSlide(delta) {
    let next = this.currentDeckSlide + delta;
    if (next < 1) next = 1;
    if (next > this.totalDeckSlides) next = this.totalDeckSlides;
    this.setDeckSlide(next);
  }

  setDeckSlide(slideNum) {
    this.currentDeckSlide = slideNum;

    // Toggle slide visibility
    document.querySelectorAll('.deck-slide').forEach((s, idx) => {
      if (idx + 1 === slideNum) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    // Update Dots
    document.querySelectorAll('.deck-dot').forEach((d, idx) => {
      if (idx + 1 === slideNum) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });

    const indicator = document.getElementById('deck-slide-indicator');
    if (indicator) indicator.innerText = `Slide ${slideNum} of ${this.totalDeckSlides}`;
  }
}

window.appNav = new AppNavigationManager();
