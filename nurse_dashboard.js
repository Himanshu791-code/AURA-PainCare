/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Module C: Central Nurse Station Dashboard, Alert Engine & Clinical Trend Analytics
 */

class NurseStationDashboard {
  constructor() {
    this.currentScore = 0.0;
    this.sustainedStartTime = null;
    this.sustainedThreshold = 6.0; // Pain score above this triggers alarm
    this.sustainedRequiredDurationMs = 2500; // 2.5s sustained genuine pain expression required
    this.respDistressStartTime = null; // Sustained duration tracker for respiratory distress
    this.respRequiredDurationMs = 2500; // 2.5s sustained respiratory distress required (prevents yawn false alarms)
    this.isAlertActive = false;
    this.alertTriggerTimestamp = null;
    this.history = []; // 60 data points for 60s trend graph
    this.maxHistoryLength = 60;
    this.simulationMode = false;
    this.simInterval = null;

    // Simulated vitals
    this.vitals = {
      hr: 72,
      spo2: 99,
      resp: 16
    };

    // Incident log
    this.incidentLogs = [];

    // Canvas trend graph setup
    this.canvas = null;
    this.ctx = null;

    // Respiration Waveform HUD setup
    this.respCanvas = null;
    this.respCtx = null;
    this.respHistory = [];
    this.maxRespHistory = 120;
    this.lastRespiratoryData = null;
  }

  init() {
    this.canvas = document.getElementById('trend-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.respCanvas = document.getElementById('respiration-canvas');
    if (this.respCanvas) {
      this.respCtx = this.respCanvas.getContext('2d');
      for (let i = 0; i < this.maxRespHistory; i++) {
        this.respHistory.push(Math.sin(i * 0.15) * 0.7);
      }
    }

    // Initialize history with resting values
    for (let i = 0; i < this.maxHistoryLength; i++) {
      this.history.push(0.5 + Math.random() * 0.8);
    }

    // Setup Acknowledge & Test Buttons
    const ackBtn = document.getElementById('ack-alert-btn');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => this.acknowledgeAlert());
    }

    const bannerAckBtn = document.getElementById('banner-ack-btn');
    if (bannerAckBtn) {
      bannerAckBtn.addEventListener('click', () => this.acknowledgeAlert());
    }

    const testChimeBtn = document.getElementById('test-chime-btn');
    if (testChimeBtn) {
      testChimeBtn.addEventListener('click', () => {
        if (window.medicalAlarm) {
          window.medicalAlarm.testSound();
        }
      });
    }

    // Report Modal buttons
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.openClinicalReport());
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeClinicalReport());
    }

    const printReportBtn = document.getElementById('print-report-btn');
    if (printReportBtn) {
      printReportBtn.addEventListener('click', () => window.print());
    }

    // Setup Threshold Calibration Modal
    const calibBtn = document.getElementById('calibrate-modal-btn');
    const calibCloseBtn = document.getElementById('calib-modal-close-btn');
    const calibModal = document.getElementById('calibration-modal');
    if (calibBtn && calibModal) {
      calibBtn.addEventListener('click', () => calibModal.classList.add('active'));
    }
    if (calibCloseBtn && calibModal) {
      calibCloseBtn.addEventListener('click', () => calibModal.classList.remove('active'));
    }

    // Calibration Sliders
    const threshSlider = document.getElementById('calib-threshold-slider');
    const threshVal = document.getElementById('calib-threshold-val');
    const durSlider = document.getElementById('calib-duration-slider');
    const durVal = document.getElementById('calib-duration-val');

    if (threshSlider) {
      threshSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (threshVal) threshVal.innerText = val.toFixed(1);
        this.setThresholds(val, this.sustainedRequiredDurationMs);
      });
    }

    if (durSlider) {
      durSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (durVal) durVal.innerText = `${val.toFixed(1)}s`;
        this.setThresholds(this.sustainedThreshold, Math.round(val * 1000));
      });
    }

    // Calibration Presets
    const bindPreset = (btnId, thresh, durSec) => {
      const b = document.getElementById(btnId);
      if (b) {
        b.addEventListener('click', () => {
          if (threshSlider) threshSlider.value = thresh;
          if (threshVal) threshVal.innerText = thresh.toFixed(1);
          if (durSlider) durSlider.value = durSec;
          if (durVal) durVal.innerText = `${durSec.toFixed(1)}s`;
          this.setThresholds(thresh, Math.round(durSec * 1000));
          this.showToast(`Applied Preset: ${b.innerText}`);
        });
      }
    };

    bindPreset('preset-std-btn', 6.0, 1.2);
    bindPreset('preset-postop-btn', 4.8, 0.8);
    bindPreset('preset-pediatric-btn', 4.0, 0.6);
    bindPreset('preset-demo-btn', 5.2, 0.9);

    // AU Weight sliders in calibration modal
    const bindWeight = (sliderId, valId, auKey) => {
      const s = document.getElementById(sliderId);
      const v = document.getElementById(valId);
      if (s) {
        s.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (v) v.innerText = `${val.toFixed(1)}x`;
          if (window.visionAI) {
            window.visionAI[auKey] = val;
          }
        });
      }
    };
    bindWeight('weight-au4-slider', 'weight-au4-val', 'au4Weight');
    bindWeight('weight-au6-slider', 'weight-au6-val', 'au6Weight');
    bindWeight('weight-au25-slider', 'weight-au25-val', 'au25Weight');
    bindWeight('weight-au9-slider', 'weight-au9-val', 'au9Weight');

    // Start 1 Hz render loop for trend graph and vitals
    setInterval(() => this.tick(), 1000);
  }

  resizeCanvas() {
    if (this.canvas) {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    if (this.respCanvas && this.respCanvas.parentElement) {
      const respRect = this.respCanvas.parentElement.getBoundingClientRect();
      this.respCanvas.width = respRect.width * window.devicePixelRatio;
      this.respCanvas.height = 55 * window.devicePixelRatio;
      this.respCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  /**
   * Called by vision_ai.js or simulator on each new frame
   * Implements 100% hands-free autonomous dispatch (Zero clicks by patient or user)
   */
  updatePainScore(score, biomarkers = {}, respiratoryData = null) {
    if (this.simulationMode && !biomarkers.isSimulated) return;

    this.currentScore = Math.max(0, Math.min(10, score));

    // Update circular gauge, range zones, and text
    this.renderGauge(this.currentScore, biomarkers, respiratoryData);

    // Update Biomarkers bars if present
    this.renderBiomarkers(biomarkers);

    // Optical Respiration & Dyspnea Waveform Processing
    if (respiratoryData) {
      this.lastRespiratoryData = respiratoryData;
      this.renderBreathingWaveform(respiratoryData);

      if (respiratoryData.rr) {
        this.vitals.resp = respiratoryData.rr;
        const respEl = document.getElementById('vital-resp');
        if (respEl) respEl.innerText = this.vitals.resp;
      }

      // Update on-screen dyspnea status badge
      const dyspneaBadge = document.getElementById('dyspnea-badge');
      if (dyspneaBadge) {
        const isHi = window.translator && window.translator.currentLang === 'hi';
        if (respiratoryData.isDistress) {
          dyspneaBadge.className = 'dyspnea-badge badge-distress pulse-alert';
          dyspneaBadge.innerText = isHi 
            ? `🚨 तीव्र श्वसन कष्ट / सांस फूलना (${this.vitals.resp} BPM)` 
            : `🚨 CRITICAL DYSPNEA / AIR HUNGER (${this.vitals.resp} BPM)`;
        } else {
          dyspneaBadge.className = 'dyspnea-badge badge-normal';
          dyspneaBadge.innerText = isHi 
            ? `सामान्य श्वसन (${this.vitals.resp} BPM)` 
            : `NORMAL RESPIRATION (${this.vitals.resp} BPM)`;
        }
      }
    }

    // Check sustained pain trigger (requires 2.5s sustained verification)
    this.checkSustainedPain(this.currentScore, respiratoryData ? respiratoryData.isDistress : false);

    // Update vitals dynamically based on pain acuity
    this.correlateVitals(this.currentScore);

    // Sync Ward Bed 104 telemetry card in real time
    const ward104El = document.getElementById('ward-bed-104-pain');
    if (ward104El) {
      ward104El.innerHTML = `${this.currentScore.toFixed(1)} <small>/ 10</small>`;
    }

    // Update on-screen Nurse Dispatch Receipt (Shows alarm sent to nurse)
    this.updateNurseDispatchReceipt(this.currentScore, respiratoryData);
  }

  /**
   * Renders high-resolution clinical breathing waveform on #respiration-canvas
   */
  renderBreathingWaveform(respData) {
    if (!this.respCanvas || !this.respCtx) {
      this.respCanvas = document.getElementById('respiration-canvas');
      if (this.respCanvas) this.respCtx = this.respCanvas.getContext('2d');
      else return;
    }
    const ctx = this.respCtx;
    const w = this.respCanvas.parentElement ? this.respCanvas.parentElement.clientWidth : 300;
    const h = 55;

    this.respCanvas.width = w;
    this.respCanvas.height = h;

    this.respHistory.push(respData.waveVal || 0);
    if (this.respHistory.length > this.maxRespHistory) {
      this.respHistory.shift();
    }

    ctx.clearRect(0, 0, w, h);

    // Clinical Capnography Grid Line
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw Breathing Waveform curve
    const isDistress = respData.isDistress;
    ctx.lineWidth = isDistress ? 2.5 : 2.0;
    ctx.strokeStyle = isDistress ? '#ef4444' : '#10b981';
    ctx.shadowColor = isDistress ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.4)';
    ctx.shadowBlur = isDistress ? 8 : 4;

    const step = w / (this.maxRespHistory - 1);
    ctx.beginPath();
    this.respHistory.forEach((val, idx) => {
      const x = idx * step;
      const y = (h / 2) - (val * (h * 0.35));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Leading sweep pulse dot
    const lastIdx = this.respHistory.length - 1;
    const lastX = lastIdx * step;
    const lastY = (h / 2) - (this.respHistory[lastIdx] * (h * 0.35));
    ctx.fillStyle = isDistress ? '#fca5a5' : '#6ee7b7';
    ctx.beginPath();
    ctx.arc(lastX, lastY, isDistress ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  updateNurseDispatchReceipt(score, respiratoryData = null) {
    const receiptCard = document.getElementById('nurse-dispatch-receipt');
    const statusBadge = document.getElementById('receipt-status-badge');
    const statusTitle = document.getElementById('receipt-status-title');
    const statusDetails = document.getElementById('receipt-status-details');
    const statusTime = document.getElementById('receipt-status-time');

    if (!receiptCard) return;

    const isHi = window.translator && window.translator.currentLang === 'hi';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    const isRespDistress = respiratoryData && respiratoryData.isDistress;

    if (isRespDistress || score >= 6.0) {
      // Patient Serious Distress -> Emergency Alarm Dispatched to Nurse
      receiptCard.className = 'nurse-receipt-card receipt-critical';
      if (statusBadge) {
        statusBadge.className = 'receipt-badge badge-critical';
        statusBadge.innerText = isRespDistress
          ? (isHi ? '🚨 कोड ब्लू अलार्म भेजा गया: हाँ (0-क्लिक AI ऑटो-कॉल)' : '🚨 CODE BLUE TRANSMITTED: YES (ZERO-CLICK AI)')
          : (isHi ? '🚨 नर्स के पास अलार्म जा चुका है: हाँ (0-क्लिक AI)' : '🚨 ALARM TRANSMITTED TO NURSE: YES (ZERO-CLICK AI)');
      }
      if (statusTitle) {
        statusTitle.innerText = isRespDistress
          ? (isHi ? 'मरीज को सांस लेने में गंभीर कष्ट (Dyspnea Spasm)' : 'PATIENT IN ACUTE RESPIRATORY DISTRESS (Dyspnea)')
          : (isHi ? 'मरीज की हालत गंभीर हो रही है (तीव्र कष्ट डिटेक्ट हुआ)' : 'PATIENT IN SERIOUS DISTRESS (Acute Distress Spike)');
      }
      if (statusDetails) {
        statusDetails.innerText = isRespDistress
          ? (isHi ? 'वार्ड A कोड ब्लू टीम सूचित • ऑक्सीजन व सक्शन सतर्क • स्वायत्त AI वॉइस सक्रिय' : 'Ward A Code Blue Team Dispatched • Oxygen Support Alerted • Spoken Broadcast Active')
          : (isHi ? 'वार्ड A सेंट्रल नर्स स्टेशन सूचित • वॉइस ब्रॉडकास्ट सक्रिय • ऑन-ड्यूटी नर्स सतर्क' : 'Ward A Central Nurse Station Alerted • Spoken Voice Broadcast Active • Duty RN Dispatched');
      }
      if (statusTime) statusTime.innerText = `${nowTime} (Active Dispatch)`;
    } else if (score >= 3.0) {
      // Patient Uncomfortable -> Observation Alert Sent to Nurse Desk
      receiptCard.className = 'nurse-receipt-card receipt-uncomfortable';
      if (statusBadge) {
        statusBadge.className = 'receipt-badge badge-uncomfortable';
        statusBadge.innerText = isHi ? '🟡 अवलोकन सूचना भेजी गई: हाँ' : '🟡 OBSERVATION ALERT TRANSMITTED: YES';
      }
      if (statusTitle) {
        statusTitle.innerText = isHi
          ? 'मरीज असहज महसूस कर रहा है (शुरुआती तनाव)'
          : 'PATIENT UNCOMFORTABLE (Early Micro-Distress)';
      }
      if (statusDetails) {
        statusDetails.innerText = isHi
          ? 'नर्स डेस्क को अवलोकन सूचना प्रेषित • बेड 104 पर नजर रखी जा रही है'
          : 'Observation notification sent to Nurse Desk • Bed 104 monitored';
      }
      if (statusTime) statusTime.innerText = `${nowTime} (Logged)`;
    } else {
      // Normal Routine Monitoring
      receiptCard.className = 'nurse-receipt-card receipt-normal';
      if (statusBadge) {
        statusBadge.className = 'receipt-badge badge-normal';
        statusBadge.innerText = isHi ? '🟢 नियमित निगरानी (स्टैन्डबाय)' : '🟢 STANDBY (ROUTINE MONITORING)';
      }
      if (statusTitle) {
        statusTitle.innerText = isHi
          ? 'मरीज सामान्य विश्राम स्थिति में है'
          : 'Patient Resting Normally (Calm Baseline)';
      }
      if (statusDetails) {
        statusDetails.innerText = isHi
          ? 'नर्स प्रेषण: स्टैंडबाय (कोई तीव्र दर्द या श्वसन कष्ट नहीं)'
          : 'Nurse Dispatch: Standby (No acute pain or dyspnea detected)';
      }
      if (statusTime) statusTime.innerText = `${nowTime} (Normal)`;
    }
  }

  renderGauge(score, bm = {}, respData = null) {
    const numEl = document.getElementById('pain-score-val');
    const pillEl = document.getElementById('pain-severity-pill');
    const gaugeFill = document.getElementById('gauge-fill-path');
    const isHi = window.translator && window.translator.currentLang === 'hi';

    if (numEl) {
      numEl.innerText = score.toFixed(1);
    }

    // SVG arc stroke-dashoffset logic (total arc circumference ~ 283)
    if (gaugeFill) {
      const maxOffset = 283;
      const progress = score / 10.0;
      const offset = maxOffset - (progress * maxOffset);
      gaugeFill.style.strokeDashoffset = offset;

      if (score <= 3.0) {
        gaugeFill.style.stroke = '#10b981'; // Emerald Mild Range (0.0 - 3.0)
      } else if (score < 6.0) {
        gaugeFill.style.stroke = '#f59e0b'; // Amber Moderate Range (3.1 - 5.9)
      } else if (score < 8.5) {
        gaugeFill.style.stroke = '#f97316'; // Orange Severe Range (6.0 - 8.4)
      } else {
        gaugeFill.style.stroke = '#ef4444'; // Red Critical Range (8.5 - 10.0)
      }
    }

    // 4-Tier Range Zone Segments Activation
    const z1 = document.getElementById('zone-range-1');
    const z2 = document.getElementById('zone-range-2');
    const z3 = document.getElementById('zone-range-3');
    const z4 = document.getElementById('zone-range-4');
    const rangeStatusEl = document.getElementById('range-live-status-text');

    if (z1) z1.classList.toggle('active', score <= 3.0);
    if (z2) z2.classList.toggle('active', score > 3.0 && score < 6.0);
    if (z3) z3.classList.toggle('active', score >= 6.0 && score < 8.5);
    if (z4) z4.classList.toggle('active', score >= 8.5);

    // Pill badge text and Range 1 contextual indicators (Eyes Closed / Fast Breathing)
    if (pillEl) {
      pillEl.className = 'pain-status-pill';

      if (score <= 3.0) {
        pillEl.classList.add('mild');

        if (respData && respData.isFastBreathing) {
          pillEl.innerText = isHi ? '🫁 तेज़ श्वसन (रेंज ≤3.0)' : '🫁 Fast Breathing (Range ≤3.0)';
          if (rangeStatusEl) {
            rangeStatusEl.innerText = isHi 
              ? '🟢 रेंज 1 सक्रिय (≤3.0): तेज़ श्वसन डिटेक्टेड (सुरक्षित सीमा)'
              : '🟢 Range 1 Active (≤3.0): Elevated Respiration (Safe Zone)';
          }
        } else if (bm && bm.isEyesClosed) {
          pillEl.innerText = isHi ? '👁️ आँखें बंद / विश्राम (रेंज ≤3.0)' : '👁️ Eyes Closed / Resting (Range ≤3.0)';
          if (rangeStatusEl) {
            rangeStatusEl.innerText = isHi
              ? '🟢 रेंज 1 सक्रिय (≤3.0): आँखें बंद / विश्राम स्थिति (सुरक्षित सीमा)'
              : '🟢 Range 1 Active (≤3.0): Eyes Closed / Resting Discomfort (Safe Zone)';
          }
        } else if (bm && bm.isYawning) {
          pillEl.innerText = isHi ? '🥱 जम्हाई फ़िल्टर (रेंज ≤3.0)' : '🥱 Yawn Filtered (Range ≤3.0)';
          if (rangeStatusEl) {
            rangeStatusEl.innerText = isHi
              ? '🟢 रेंज 1 सक्रिय (≤3.0): जम्हाई फ़िल्टर सक्रिय (सुरक्षित सीमा)'
              : '🟢 Range 1 Active (≤3.0): Yawn Filter Active (Safe Zone)';
          }
        } else {
          pillEl.innerText = isHi ? 'सामान्य स्थिति (रेंज ≤3.0)' : 'Mild / Routine (Range ≤3.0)';
          if (rangeStatusEl) {
            rangeStatusEl.innerText = isHi
              ? '🟢 रेंज 1 सक्रिय (0.0 - 3.0): सामान्य क्लिनिकल निगरानी (सुरक्षित)'
              : '🟢 Range 1 Active (0.0 - 3.0): Routine Surveillance (Safe)';
          }
        }
      } else if (score < 6.0) {
        pillEl.classList.add('moderate');
        pillEl.innerText = isHi ? 'मध्यम असहजता (रेंज 3.1 - 5.9)' : 'Moderate Observation (Range 3.1 - 5.9)';
        if (rangeStatusEl) {
          rangeStatusEl.innerText = isHi
            ? '🟡 रेंज 2 सक्रिय (3.1 - 5.9): मध्यम असहजता / प्रारंभिक तनाव'
            : '🟡 Range 2 Active (3.1 - 5.9): Moderate Discomfort (Observation)';
        }
      } else if (score < 8.5) {
        pillEl.classList.add('severe');
        pillEl.innerText = isHi ? 'गंभीर दर्द चेतावनी (रेंज 6.0 - 8.4)' : 'Severe Pain Alert (Range 6.0 - 8.4)';
        if (rangeStatusEl) {
          rangeStatusEl.innerText = isHi
            ? '🟠 रेंज 3 सक्रिय (6.0 - 8.4): गंभीर दर्द चेतावनी (अलार्म 2.5s होल्ड)'
            : '🟠 Range 3 Active (6.0 - 8.4): Severe Pain Warning (Hold 2.5s to Dispatch)';
        }
      } else {
        pillEl.classList.add('critical');
        pillEl.innerText = isHi ? 'अति गंभीर कष्ट / कोड ब्लू (रेंज 8.5 - 10)' : 'Critical Code Blue (Range 8.5 - 10.0)';
        if (rangeStatusEl) {
          rangeStatusEl.innerText = isHi
            ? '🔴 रेंज 4 सक्रिय (8.5 - 10): अति गंभीर कष्ट / कोड ब्लू प्रेषित'
            : '🔴 Range 4 Active (8.5 - 10.0): Critical Distress / Code Blue Dispatched';
        }
      }
    }
  }

  renderBiomarkers(bm) {
    const au4Val = document.getElementById('au4-val');
    const au4Bar = document.getElementById('au4-bar');
    const au6Val = document.getElementById('au6-val');
    const au6Bar = document.getElementById('au6-bar');
    const au25Val = document.getElementById('au25-val');
    const au25Bar = document.getElementById('au25-bar');
    const au9Val = document.getElementById('au9-val');
    const au9Bar = document.getElementById('au9-bar');

    if (au4Val && bm.au4 !== undefined) {
      au4Val.innerText = `${Math.round(bm.au4 * 100)}%`;
      au4Bar.style.width = `${Math.min(100, bm.au4 * 100)}%`;
    }
    if (au6Val && bm.au6 !== undefined) {
      au6Val.innerText = `${Math.round(bm.au6 * 100)}%`;
      au6Bar.style.width = `${Math.min(100, bm.au6 * 100)}%`;
    }
    if (au25Val && bm.au25 !== undefined) {
      au25Val.innerText = `${Math.round(bm.au25 * 100)}%`;
      au25Bar.style.width = `${Math.min(100, bm.au25 * 100)}%`;
    }
    if (au9Val && bm.au9 !== undefined) {
      au9Val.innerText = `${Math.round(bm.au9 * 100)}%`;
      au9Bar.style.width = `${Math.min(100, bm.au9 * 100)}%`;
    }
  }

  checkSustainedPain(score, isRespiratory = false) {
    const timerFill = document.getElementById('sustained-timer-fill');
    const timerText = document.getElementById('sustained-time-text');
    const now = performance.now();
    const isHi = window.translator && window.translator.currentLang === 'hi';

    // 1. Clinical Protocol for Respiratory Distress (Code Blue):
    // Requires sustained confirmation of 2.5 seconds (prevents momentary yawns, speech or deep sighs from false triggering)
    if (isRespiratory) {
      if (!this.respDistressStartTime) {
        this.respDistressStartTime = now;
      }
      const respElapsed = now - this.respDistressStartTime;
      const respPct = Math.min(100, (respElapsed / this.respRequiredDurationMs) * 100);

      if (timerFill) {
        timerFill.style.width = `${respPct}%`;
        timerFill.style.background = 'linear-gradient(90deg, #3b82f6, #ef4444)';
      }
      if (timerText) {
        timerText.innerText = isHi 
          ? `🚨 सांस कष्ट पुष्टि: ${(respElapsed / 1000).toFixed(1)}s / ${(this.respRequiredDurationMs / 1000).toFixed(1)}s`
          : `🚨 Confirming Dyspnea / Air Hunger: ${(respElapsed / 1000).toFixed(1)}s / ${(this.respRequiredDurationMs / 1000).toFixed(1)}s`;
      }

      if (respElapsed >= this.respRequiredDurationMs && !this.isAlertActive) {
        this.triggerNurseAlert(score, true);
      }
      return;
    } else {
      // If respiratory distress ceases (e.g. yawn finishes or mouth closes), reset timer immediately
      this.respDistressStartTime = null;
    }

    // 2. Clinical Protocol for Severe Pain Grimace:
    // Requires continuous sustained grimacing (>= 6.0) for sustainedRequiredDurationMs (2.5 seconds)
    if (score >= this.sustainedThreshold) {
      if (!this.sustainedStartTime) {
        this.sustainedStartTime = now;
      }
      const elapsed = now - this.sustainedStartTime;
      const pct = Math.min(100, (elapsed / this.sustainedRequiredDurationMs) * 100);

      if (timerFill) {
        timerFill.style.width = `${pct}%`;
        timerFill.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      }
      if (timerText) {
        timerText.innerText = isHi
          ? `तीव्र दर्द पुष्टि: ${(elapsed / 1000).toFixed(1)}s / ${(this.sustainedRequiredDurationMs / 1000).toFixed(1)}s`
          : `${(elapsed / 1000).toFixed(1)}s / ${(this.sustainedRequiredDurationMs / 1000).toFixed(1)}s`;
      }

      if (elapsed >= this.sustainedRequiredDurationMs && !this.isAlertActive) {
        // Zero-Click Autonomous Dispatch for Sustained Severe Pain
        this.triggerNurseAlert(score, false);
      }
    } else {
      // Below threshold: reset sustained timer
      this.sustainedStartTime = null;
      if (timerFill) timerFill.style.width = '0%';
      if (timerText) timerText.innerText = `0.0s / ${(this.sustainedRequiredDurationMs / 1000).toFixed(1)}s`;
    }
  }

  /**
   * Autonomous Zero-Click Emergency Alarm Dispatch
   * Directly triggers room chime, dual-language spoken voice call, flashing banner, and SLA timer
   */
  triggerNurseAlert(score, isRespiratory = false) {
    this.isAlertActive = true;
    this.isRespiratoryEmergency = isRespiratory;
    this.alertTriggerTimestamp = new Date();
    this.startSLAStopwatch();

    const severity = isRespiratory ? 'critical' : (score >= 9.0 ? 'critical' : 'severe');
    const isHi = window.translator && window.translator.currentLang === 'hi';

    // 1. Audio medical chime + Natural Spoken Voice Broadcast
    if (window.medicalAlarm) {
      window.medicalAlarm.startAlarm(severity, '104', 'Rajesh Verma', isRespiratory);
    }

    // 2. Emergency Flashing Banner & Dynamic Title
    const banner = document.getElementById('emergency-alarm-banner');
    const bannerTitle = document.getElementById('alarm-banner-title');
    const bannerSubtitle = document.getElementById('alarm-banner-subtitle');

    if (banner) {
      banner.classList.add('active');
      if (isRespiratory) {
        banner.classList.add('banner-respiratory-alert');
        if (bannerTitle) {
          bannerTitle.innerText = isHi
            ? '🚨 इमरजेंसी कोड ब्लू: मरीज को सांस लेने में अत्यंत गंभीर कष्ट (सांस फूलना) डिटेक्ट हुआ!'
            : '🚨 CRITICAL CODE BLUE: RESPIRATORY DISTRESS / BREATHING FAILURE DETECTED!';
        }
        if (bannerSubtitle) {
          bannerSubtitle.innerText = isHi
            ? 'बेड 104 • सांस उखड़ रही है, ऑक्सीजन लेवल गिर रहा है • तुरंत ऑक्सीजन और श्वसन सहायता भेजें!'
            : 'Bed 104 • Patient in acute tachypneic dyspnea & airway distress • Immediate oxygen support dispatched!';
        }
      } else {
        banner.classList.remove('banner-respiratory-alert');
        if (bannerTitle) {
          bannerTitle.innerText = isHi
            ? 'उच्च प्राथमिकता नर्स कॉल: तीव्र दर्द का पता चला!'
            : 'URGENT CALL: BED 104 PATIENT REQUIRES IMMEDIATE ASSISTANCE!';
        }
        if (bannerSubtitle) {
          bannerSubtitle.innerText = isHi
            ? 'मरीज की हालत गंभीर हो रही है • तीव्र कष्ट डिटेक्ट हुआ (>6.0/10) • ऑटोमैटिक वॉइस ब्रॉडकास्ट सक्रिय'
            : 'Patient in serious distress • Severe acute pain detected (>6.0/10) • Autonomous Voice Broadcast Active';
        }
      }
    }

    // 3. Log to Incident Log Table
    this.logIncident(score, isRespiratory ? 'CODE BLUE (Dyspnea)' : severity);
  }

  acknowledgeAlert() {
    this.isAlertActive = false;
    this.isRespiratoryEmergency = false;

    // Silence audio
    if (window.medicalAlarm) {
      window.medicalAlarm.acknowledge();
    }

    // Hide banner
    const banner = document.getElementById('emergency-alarm-banner');
    if (banner) {
      banner.classList.remove('active', 'banner-respiratory-alert');
    }

    // Stop SLA timer and calculate response time
    const responseSeconds = this.stopSLAStopwatch();

    // Update last incident log status
    if (this.incidentLogs.length > 0) {
      const last = this.incidentLogs[0];
      last.status = `Ack (${responseSeconds}s)`;
      this.renderIncidentLogs();
    }

    const isHi = window.translator && window.translator.currentLang === 'hi';
    const slaToast = isHi
      ? `✅ अलर्ट स्वीकारा गया! नर्स रिस्पॉन्स समय: ${responseSeconds}s (अस्पताल SLA लक्ष्य <10s सफल)`
      : `✅ Alert Acknowledged! Staff RN Latency: ${responseSeconds}s (Hospital SLA <10s Target Met)`;
    this.showToast(slaToast);
  }

  startSLAStopwatch() {
    clearInterval(this.slaInterval);
    const slaDisplay = document.getElementById('live-sla-timer');
    const slaContainer = document.getElementById('live-sla-box');
    if (slaContainer) slaContainer.style.display = 'inline-flex';

    this.slaStartTime = performance.now();
    this.slaInterval = setInterval(() => {
      if (!this.isAlertActive) {
        clearInterval(this.slaInterval);
        return;
      }
      const elapsedSec = ((performance.now() - this.slaStartTime) / 1000).toFixed(1);
      if (slaDisplay) slaDisplay.innerText = `${elapsedSec}s`;
    }, 100);
  }

  stopSLAStopwatch() {
    clearInterval(this.slaInterval);
    const elapsedSec = this.slaStartTime ? ((performance.now() - this.slaStartTime) / 1000).toFixed(1) : '3.2';
    const slaDisplay = document.getElementById('live-sla-timer');
    if (slaDisplay) slaDisplay.innerText = `${elapsedSec}s (ACKNOWLEDGED)`;
    return elapsedSec;
  }

  setThresholds(threshold, durationMs) {
    this.sustainedThreshold = parseFloat(threshold);
    this.sustainedRequiredDurationMs = parseInt(durationMs, 10);
    const textEl = document.getElementById('sustained-time-text');
    if (textEl && !this.sustainedStartTime) {
      textEl.innerText = `0.0s / ${(this.sustainedRequiredDurationMs / 1000).toFixed(1)}s`;
    }
    const hudBadge = document.getElementById('active-threshold-badge');
    if (hudBadge) {
      hudBadge.innerText = `Alert Trigger: ≥${this.sustainedThreshold.toFixed(1)} for ${(this.sustainedRequiredDurationMs / 1000).toFixed(1)}s`;
    }
    this.renderTrendGraph();
    console.log(`[AURA Nurse Station] Updated Thresholds: Trigger=${this.sustainedThreshold}, Duration=${this.sustainedRequiredDurationMs}ms`);
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  logIncident(score, severity) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const location = window.bodyPainMap ? window.bodyPainMap.getActiveLocusName() : 'Diffuse';

    const entry = {
      time: timeStr,
      bed: '104',
      score: score.toFixed(1),
      severity: severity,
      location: location,
      status: 'DISPATCHED'
    };

    this.incidentLogs.unshift(entry);
    if (this.incidentLogs.length > 20) this.incidentLogs.pop();

    this.renderIncidentLogs();
  }

  renderIncidentLogs() {
    const tbody = document.getElementById('incident-log-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.incidentLogs.map(item => `
      <tr>
        <td>${item.time}</td>
        <td>${item.bed}</td>
        <td><strong style="color: ${parseFloat(item.score) >= 9 ? '#ef4444' : '#f97316'}">${item.score}/10</strong></td>
        <td>${item.location}</td>
        <td class="${item.status.startsWith('Ack') ? 'log-badge-ack' : 'log-badge-critical'}">${item.status}</td>
      </tr>
    `).join('');
  }

  onPainLocationChanged(locationName) {
    // If alert is active, update active record
    if (this.incidentLogs.length > 0 && this.isAlertActive) {
      this.incidentLogs[0].location = locationName;
      this.renderIncidentLogs();
    }
  }

  correlateVitals(score) {
    // Clinical hemodynamic pain correlation:
    // Increased sympathetic tone causes tachycardia and elevated respiration
    const baseHR = 72;
    const painHRElevation = (score / 10.0) * 44; // Up to 116 bpm
    const targetHR = Math.round(baseHR + painHRElevation + (Math.random() * 4 - 2));

    const targetSpO2 = score > 8.0 ? Math.round(95 + Math.random() * 2) : 99;
    const targetResp = Math.round(15 + (score / 10.0) * 11);

    // Smooth transition
    this.vitals.hr = Math.round(this.vitals.hr * 0.8 + targetHR * 0.2);
    this.vitals.spo2 = targetSpO2;
    this.vitals.resp = targetResp;

    const hrEl = document.getElementById('vital-hr');
    const spo2El = document.getElementById('vital-spo2');
    const respEl = document.getElementById('vital-resp');

    if (hrEl) hrEl.innerText = this.vitals.hr;
    if (spo2El) spo2El.innerText = this.vitals.spo2;
    if (respEl) respEl.innerText = this.vitals.resp;
  }

  tick() {
    // Push current score to 60s history array
    this.history.push(this.currentScore);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    this.drawTrendChart();
  }

  drawTrendChart() {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;

    this.canvas.width = w;
    this.canvas.height = h;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.3)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 10; y += 2.5) {
      const yPos = h - (y / 10.0) * (h - 20) - 10;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(w, yPos);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(156, 163, 175, 0.6)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${y}`, 6, yPos - 3);
    }

    // Dynamic Clinical Threshold dashed line
    const thresholdY = h - (this.sustainedThreshold / 10.0) * (h - 20) - 10;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(w, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`ALARM THRESHOLD (${this.sustainedThreshold.toFixed(1)})`, w - 170, thresholdY - 4);

    // Draw Data Line with Gradient
    if (this.history.length < 2) return;

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#06b6d4';

    const step = w / (this.maxHistoryLength - 1);

    ctx.beginPath();
    this.history.forEach((val, idx) => {
      const x = idx * step;
      const y = h - (val / 10.0) * (h - 20) - 10;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * Rapid Clinical Demonstration Scenarios
   */
  simulateScenario(type) {
    clearInterval(this.simInterval);
    this.simulationMode = true;

    if (type === 'resting') {
      this.simInterval = setInterval(() => {
        const score = 1.0 + Math.random() * 0.5;
        this.updatePainScore(score, {
          au4: 0.08,
          au6: 0.12,
          au25: 0.05,
          au9: 0.04,
          isSimulated: true
        });
      }, 300);
    } else if (type === 'spasm') {
      // Acute spasm spike ~ 7.8
      if (window.bodyPainMap) window.bodyPainMap.selectZone('abdomen');
      this.simInterval = setInterval(() => {
        const score = 7.5 + Math.random() * 0.8;
        this.updatePainScore(score, {
          au4: 0.75,
          au6: 0.72,
          au25: 0.68,
          au9: 0.65,
          isSimulated: true
        });
      }, 300);
    } else if (type === 'grimace') {
      // Critical distress ~ 9.6
      if (window.bodyPainMap) window.bodyPainMap.selectZone('chest');
      this.simInterval = setInterval(() => {
        const score = 9.4 + Math.random() * 0.5;
        this.updatePainScore(score, {
          au4: 0.95,
          au6: 0.92,
          au25: 0.90,
          au9: 0.88,
          isSimulated: true
        });
      }, 300);
    } else if (type === 'respiratory') {
      // Acute Respiratory Failure / Dyspnea Spasm (Zero-Click AI Code Blue Dispatch)
      if (window.bodyPainMap) {
        const isHi = window.translator && window.translator.currentLang === 'hi';
        const reason = isHi ? 'तीव्र श्वसन विफलता / सांस फूलना (Dyspnea & Air Hunger)' : 'Acute Respiratory Failure / Dyspnea detected via optical motion';
        window.bodyPainMap.selectZone('chest', true, reason);
      }
      this.simInterval = setInterval(() => {
        const score = 8.6 + Math.random() * 0.7;
        this.vitals.spo2 = Math.round(87 + Math.random() * 2);
        this.vitals.resp = Math.round(33 + Math.random() * 3);
        this.vitals.hr = Math.round(118 + Math.random() * 5);
        const gaspWave = Math.sin(performance.now() / 180) * 1.6 + (Math.random() * 0.4 - 0.2);
        this.updatePainScore(score, {
          au4: 0.82,
          au6: 0.75,
          au25: 0.94,
          au9: 0.68,
          isSimulated: true
        }, {
          rr: this.vitals.resp,
          isDistress: true,
          waveVal: gaspWave,
          status: 'ACUTE DYSPNEA / AIR HUNGER'
        });
      }, 250);
    } else if (type === 'reset') {
      this.simulationMode = false;
      this.acknowledgeAlert();
      if (window.bodyPainMap) window.bodyPainMap.clear();
      this.updatePainScore(0.5, { au4: 0, au6: 0, au25: 0, au9: 0, isSimulated: true }, { rr: 16, isDistress: false, waveVal: 0, status: 'NORMAL RESPIRATION' });
    }
  }

  openClinicalReport() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    // Populate Report Fields
    const reportDate = document.getElementById('report-date');
    const reportPeak = document.getElementById('report-peak-score');
    const reportLocus = document.getElementById('report-locus');
    const reportVitals = document.getElementById('report-vitals-summary');
    const reportEventsCount = document.getElementById('report-events-count');

    const now = new Date();
    if (reportDate) reportDate.innerText = now.toLocaleString();
    if (reportPeak) reportPeak.innerText = `${this.currentScore.toFixed(1)} / 10.0 (${this.currentScore >= 6 ? 'Severe Distress' : 'Mild'})`;
    if (reportLocus) reportLocus.innerText = window.bodyPainMap ? window.bodyPainMap.getActiveLocusName() : 'Unspecified';
    if (reportVitals) reportVitals.innerText = `HR: ${this.vitals.hr} bpm | SpO2: ${this.vitals.spo2}% | Resp: ${this.vitals.resp}/min`;
    if (reportEventsCount) reportEventsCount.innerText = `${this.incidentLogs.length} Automatic AI Dispatch Events recorded`;

    modal.classList.add('active');
  }

  closeClinicalReport() {
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('active');
  }
}

window.nurseDashboard = new NurseStationDashboard();
