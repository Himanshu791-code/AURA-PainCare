/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Voice-Assistive ICU Communication Engine (Speech-to-Action)
 * 
 * Provides hands-free voice assistance for non-verbal, intubated, or weak patients
 * and clinical attendants. Listens via microphone in Hindi, Hinglish, or Indian English,
 * matches intent to 8 ICU communication cards, strobes target card, announces room-wide
 * in dual-language TTS (Indian English + Hindi), and dispatches alert to Central Nurse Station.
 */

class VoiceAssistiveEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.selectedLang = 'hi-IN'; // Indian multilingual recognition
    this.activeCardTimeout = null;
    this.restartTimeout = null;
    this.isProtocolFile = typeof window !== 'undefined' && window.location.protocol === 'file:';

    // 8 Core ICU Non-Verbal Communication Actions with Exhaustive Multi-Language Keywords
    this.cardActions = [
      {
        index: 0,
        id: 'water',
        icon: '💧',
        nameEn: 'Need Water',
        nameHi: 'पानी चाहिए',
        msgEn: 'Patient is requesting drinking water',
        msgHi: 'मरीज को पीने के लिए पानी चाहिए',
        keywords: [
          'water', 'pani', 'paani', 'pyaas', 'pyas', 'jal', 'peena', 'drink', 'drinking',
          'thirst', 'thirsty', 'sip', 'पानी', 'प्यास', 'जल', 'पीना', 'पानी दो', 'पानी चाहिए',
          'paani do', 'pani do', 'pani chahiye', 'paani chahiye', 'वाटर', 'वॉटर', 'नीड वाटर', 'नीड वॉटर'
        ]
      },
      {
        index: 1,
        id: 'pain',
        icon: '⚡',
        nameEn: 'Extreme Pain Spasm',
        nameHi: 'असहनीय तेज दर्द',
        msgEn: 'Emergency! Patient is experiencing an unbearable pain spasm!',
        msgHi: 'इमरजेंसी! मरीज को असहनीय तेज दर्द का दौरा पड़ रहा है!',
        keywords: [
          'pain', 'dard', 'spasm', 'severe', 'extreme', 'hurts', 'hurting', 'ache', 'unbearable',
          'painkiller', 'medicine', 'dawa', 'injection', 'teevra', 'takleef', 'peeda', 'kasht',
          'दर्द', 'तेज दर्द', 'बहुत दर्द', 'असहनीय', 'पीड़ा', 'दवा', 'दर्द हो रहा है', 'पेन',
          'bahut dard', 'tez dard', 'bahut dard ho raha', 'dard hai', 'स्पैजम', 'एक्सट्रीम पेन', 'सीवियर पेन'
        ]
      },
      {
        index: 2,
        id: 'breathe',
        icon: '🫁',
        nameEn: 'Cannot Breathe',
        nameHi: 'सांस में तकलीफ',
        msgEn: 'Critical! Patient is having severe difficulty breathing!',
        msgHi: 'क्रिटिकल! मरीज को सांस लेने में अत्यधिक तकलीफ हो रही है!',
        keywords: [
          'breathe', 'breath', 'breathing', 'saans', 'sans', 'saas', 'choke', 'choking', 'suffocate',
          'suffocating', 'suffocation', 'oxygen', 'dyspnea', 'asthma', 'air', 'dam ghut',
          'सांस', 'सास', 'सांस नहीं', 'सांस में तकलीफ', 'दम घुट', 'ऑक्सीजन', 'दम घुटना', 'हवा',
          'saans nahi aa rahi', 'sans lene me takleef', 'dam ghut raha hai', 'breathless', 'ब्रीद', 'कांट ब्रीद', 'कैन नॉट ब्रीद'
        ]
      },
      {
        index: 3,
        id: 'position',
        icon: '🔄',
        nameEn: 'Change Position',
        nameHi: 'करवट बदलें',
        msgEn: 'Patient requests a change in bed posture or position',
        msgHi: 'मरीज को करवट या लेटने की स्थिति बदलनी है',
        keywords: [
          'position', 'posture', 'karwat', 'karvat', 'turn', 'side', 'sit', 'baithna', 'move',
          'straight', 'lying', 'angle', 'uthna', 'करवट', 'पोजीशन', 'बैठना', 'करवट बदलें',
          'karwat badlo', 'karwat badalna', 'poshition', 'uthaye', 'seedhe baitho', 'चेंज पोजीशन', 'पोजीशन बदलो'
        ]
      },
      {
        index: 4,
        id: 'doctor',
        icon: '🩺',
        nameEn: 'Call Doctor',
        nameHi: 'डॉक्टर बुलाएं',
        msgEn: 'Urgent! Patient requests the attending physician immediately',
        msgHi: 'जरूरी! मरीज डॉक्टर को तुरंत बुलाना चाहता है',
        keywords: [
          'doctor', 'dr', 'physician', 'surgeon', 'chikitsak', 'dakhtar', 'daktar', 'consultant',
          'bulao', 'डॉक्टर', 'चिकित्सक', 'डॉक्टर बुलाओ', 'डॉक्टर को बुलाओ', 'डॉक्टर साहब',
          'doctor bulao', 'doctor ko bulao', 'dr bulao', 'call doctor', 'डाक्टर', 'कॉल डॉक्टर'
        ]
      },
      {
        index: 5,
        id: 'cold',
        icon: '❄️',
        nameEn: 'Feeling Cold',
        nameHi: 'ठंड / कंबल चाहिए',
        msgEn: 'Patient is feeling cold and requests a warm blanket',
        msgHi: 'मरीज को ठंड लग रही है, कंबल की आवश्यकता है',
        keywords: [
          'cold', 'thand', 'thandi', 'blanket', 'kambal', 'freeze', 'freezing', 'chilly', 'shiver',
          'chadar', 'chaadar', 'sheet', 'warm', 'ठंड', 'कंबल', 'कंबल चाहिए', 'कांप', 'चादर',
          'thand lag rahi hai', 'kambal chahiye', 'kambal do', 'chadar do', 'कोल्ड', 'ब्लैंकेट'
        ]
      },
      {
        index: 6,
        id: 'suction',
        icon: '🧹',
        nameEn: 'Suction Needed',
        nameHi: 'कफ / सक्शन',
        msgEn: 'Patient requires airway mucus clearance and suction',
        msgHi: 'मरीज को सांस नली से कफ साफ करने (सक्शन) की जरूरत है',
        keywords: [
          'suction', 'cough', 'phlegm', 'mucus', 'airway', 'clear', 'throat', 'balgam', 'kaf',
          'kaph', 'khansi', 'khasi', 'gala', 'कफ', 'सक्शन', 'बलगम', 'खांसी', 'गला साफ',
          'kaph saaf karo', 'gale me kaph', 'balgham', 'suction karo', 'सक्शन चाहिए'
        ]
      },
      {
        index: 7,
        id: 'nurse',
        icon: '🤝',
        nameEn: 'Need Nurse / Family',
        nameHi: 'घबराहट / सांत्वना',
        msgEn: 'Patient is feeling high anxiety and needs nurse reassurance',
        msgHi: 'मरीज को अत्यधिक घबराहट हो रही है, नर्स की उपस्थिति चाहिए',
        keywords: [
          'nurse', 'sister', 'help', 'madad', 'anxiety', 'ghabrahat', 'scared', 'fear', 'family',
          'attendant', 'bachao', 'koi aao', 'support', 'नर्स', 'सिस्टर', 'मदद', 'घबराहट', 'परिवार',
          'nurse bulao', 'sister bulao', 'madad karo', 'help me', 'dar lag raha hai', 'हेल्प', 'सिस्टर बुलाओ'
        ]
      }
    ];
  }

  /**
   * Initializes SpeechRecognition, keyboard shortcuts, and UI controls
   */
  init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRec) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.selectedLang;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.updateUIState('listening');
          console.log('[AURA Voice Assist] Live microphone listener engaged.');
        };

        this.recognition.onresult = (event) => {
          this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
          console.warn('[AURA Voice Assist] SpeechRecognition status:', event.error);

          if (event.error === 'not-allowed') {
            this.isListening = false;
            this.updateUIState('permission-denied');
          } else if (event.error === 'network') {
            console.warn('[AURA Voice Assist] Network connection notice on speech recognizer.');
            this.updateUIState('network-error');
          } else if (event.error === 'no-speech') {
            // Normal silent intervals in ICU
          } else {
            this.updateUIState('error', event.error);
          }
        };

        this.recognition.onend = () => {
          // Auto-recovery: if listening was active, re-arm seamlessly
          if (this.isListening) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              if (this.isListening) {
                try {
                  this.recognition.start();
                } catch (e) {
                  // already started or busy
                }
              }
            }, 300);
          } else {
            this.updateUIState('standby');
          }
        };
      } catch (err) {
        console.error('[AURA Voice Assist] Failed to initialize SpeechRecognition:', err);
        this.isSupported = false;
      }
    } else {
      console.warn('[AURA Voice Assist] SpeechRecognition API unavailable. Fallback simulation active.');
      this.isSupported = false;
    }

    this.bindDOMControls();
    this.bindGlobalKeyboardShortcuts();
    this.checkProtocolNotice();
    this.updateUIState('standby');
  }

  /**
   * Checks if running on file:// protocol and shows helper guidance
   */
  checkProtocolNotice() {
    if (this.isProtocolFile) {
      console.warn('[AURA Voice Assist] Running on file:// protocol. Chrome restricts SpeechRecognition on file://.');
      const noticeBox = document.getElementById('voice-protocol-notice');
      if (noticeBox) {
        noticeBox.style.display = 'block';
      }
    }
  }

  /**
   * Binds toggle button, demo triggers, and card data attributes
   */
  bindDOMControls() {
    const toggleBtn = document.getElementById('btn-toggle-voice');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleListening();
      });
    }

    // Attach click listeners to cards to update cards
    document.querySelectorAll('.comm-card').forEach((card, idx) => {
      card.setAttribute('data-card-index', idx);
    });
  }

  /**
   * Toggles speech recognition language between Hindi (hi-IN) and English (en-IN)
   */
  toggleSpeechLang() {
    this.selectedLang = this.selectedLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
    if (this.recognition) {
      this.recognition.lang = this.selectedLang;
    }
    const label = document.getElementById('current-speech-lang-text');
    if (label) {
      label.innerText = this.selectedLang === 'hi-IN' ? 'Hindi (hi-IN)' : 'English (en-IN)';
    }
    const isHi = window.translator && window.translator.currentLang === 'hi';
    const msg = this.selectedLang === 'hi-IN'
      ? (isHi ? "🌐 स्पीच लैंग्वेज: हिन्दी (hi-IN) सेट" : "🌐 Speech Language: Hindi (hi-IN) Active")
      : (isHi ? "🌐 स्पीच लैंग्वेज: English (en-IN) सेट" : "🌐 Speech Language: English (en-IN) Active");
    if (window.appNav) window.appNav.showToast(msg);
  }

  /**
   * Global Keyboard Shortcut: Pressing 'V' toggles Voice Listening anywhere!
   */
  bindGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        this.toggleListening();
      }
    });
  }

  /**
   * Toggles Speech Recognition on/off
   */
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  /**
   * Starts listening with explicit microphone permission request
   */
  startListening() {
    // If running on file://, notify user that local server is running on 8000
    if (this.isProtocolFile) {
      const isHi = window.translator && window.translator.currentLang === 'hi';
      const msg = isHi
        ? "⚠️ ब्राउज़र file:// पर माइक्रोफोन ब्लॉक करता है। कृपया ऊपर दिए गए लिंक से http://127.0.0.1:8000 खोलें, या नीचे डेमो बटनों का उपयोग करें!"
        : "⚠️ Browsers block microphone on file://. Please open http://127.0.0.1:8000/index.html (Server is running!), or use the demo buttons below!";
      if (window.appNav) window.appNav.showToast(msg);
    }

    if (!this.recognition) {
      if (window.appNav) {
        window.appNav.showToast("⚠️ Speech Recognition is not supported by your browser. Use the demo chips below!");
      }
      this.updateUIState('unsupported');
      return;
    }

    // Explicit getUserMedia to guarantee browser permission prompt in Chromium
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Release track immediately
          stream.getTracks().forEach(t => t.stop());
          this.executeRecognitionStart();
        })
        .catch((err) => {
          console.warn('[AURA Voice Assist] getUserMedia note:', err);
          // Try recognition anyway (might already be allowed)
          this.executeRecognitionStart();
        });
    } else {
      this.executeRecognitionStart();
    }
  }

  executeRecognitionStart() {
    try {
      this.isListening = true;
      this.recognition.lang = this.selectedLang;
      this.recognition.start();
      this.updateUIState('listening');

      const isHi = window.translator && window.translator.currentLang === 'hi';
      const toastText = isHi
        ? "🎙️ वॉयस असिस्टेंट सक्रिय: कृपया अपनी जरूरत बोलें (उदा. 'पानी चाहिए', 'सांस में तकलीफ')"
        : "🎙️ Voice Assistant Active: Speak your request (e.g. 'Need Water', 'Cannot Breathe')";
      if (window.appNav) window.appNav.showToast(toastText);
    } catch (e) {
      console.warn('[AURA Voice Assist] Start error (maybe already active):', e);
      this.updateUIState('listening');
    }
  }

  stopListening() {
    this.isListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.updateUIState('standby');
    const isHi = window.translator && window.translator.currentLang === 'hi';
    if (window.appNav) {
      window.appNav.showToast(isHi ? "🔇 वॉयस असिस्टेंट स्टैंडबाय पर है" : "🔇 Voice Assistant is on Standby");
    }
  }

  /**
   * Handles SpeechRecognition result event
   */
  handleSpeechResult(event) {
    // Avoid self-triggering while audio alarm is actively broadcasting room-wide
    if (window.medicalAlarm && window.medicalAlarm.isBroadcasting) {
      console.log('[AURA Voice Assist] Suppressing microphone input during active TTS broadcast.');
      return;
    }

    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += piece;
      } else {
        interimTranscript += piece;
      }
    }

    const transcriptEl = document.getElementById('voice-transcript-text');
    if (interimTranscript && transcriptEl) {
      transcriptEl.innerHTML = `<span class="interim-text">👂 Hearing: "${interimTranscript.trim()}"...</span>`;
    }

    if (finalTranscript.trim().length > 0) {
      this.processSpokenTranscript(finalTranscript.trim(), false);
    }
  }

  /**
   * Classifies spoken transcript intent and triggers matching ICU card
   * @param {string} rawTranscript - Spoken text
   * @param {boolean} isSimulation - True if triggered by click/simulation chip (bypasses audio suppression)
   */
  processSpokenTranscript(rawTranscript, isSimulation = false) {
    if (!rawTranscript) return;

    // Suppress acoustic loop only for live mic inputs, NEVER for simulated clicks
    if (!isSimulation && window.medicalAlarm && window.medicalAlarm.isBroadcasting) {
      console.log('[AURA Voice Assist] Suppressing live mic echo during audio broadcast.');
      return;
    }

    const cleanedText = rawTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    const words = cleanedText.split(/\s+/);

    console.log(`[AURA Voice Assist] Spoken Input: "${rawTranscript}" (Normalized: "${cleanedText}")`);

    let bestMatch = null;
    let highestScore = 0;

    // Multi-factor keyword scoring algorithm
    for (const card of this.cardActions) {
      let score = 0;

      for (const kw of card.keywords) {
        const kwLower = kw.toLowerCase().trim();

        // Exact match
        if (cleanedText === kwLower) {
          score += 30;
        }
        // Transcript includes entire keyword phrase
        else if (cleanedText.includes(kwLower)) {
          score += 15 + Math.min(kwLower.length, 10);
        }
        // Individual word in transcript matches keyword
        else if (words.includes(kwLower)) {
          score += 10;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = card;
      }
    }

    const transcriptEl = document.getElementById('voice-transcript-text');

    if (bestMatch && highestScore >= 10) {
      console.log(`[AURA Voice Assist] Matched Intent: ${bestMatch.id} (Score: ${highestScore})`);
      this.executeCardAction(bestMatch, rawTranscript);
    } else {
      console.log(`[AURA Voice Assist] Unrecognized speech: "${rawTranscript}"`);
      if (transcriptEl) {
        const isHi = window.translator && window.translator.currentLang === 'hi';
        transcriptEl.innerHTML = `
          <div class="unmatched-text">
            ⚠️ <strong>${isHi ? 'सुना गया:' : 'Heard:'}</strong> "${rawTranscript}" 
            <br><small style="color: #94a3b8;">${isHi ? 'कोई मेल नहीं मिला (बोलें: "पानी", "दर्द", "सांस", "डॉक्टर", "कंबल", "सक्शन")' : 'No matching action (Try: "Water", "Pain", "Breathe", "Doctor", "Blanket")'}</small>
          </div>
        `;
      }
    }
  }

  /**
   * Executes the identified card action
   */
  executeCardAction(card, spokenText) {
    const isHi = window.translator && window.translator.currentLang === 'hi';
    const cardTitle = isHi ? card.nameHi : card.nameEn;

    // 1. If currently on another view, automatically switch to Tab 3 (Body Map / Voice Board)
    if (window.appNav && window.appNav.currentTab !== 'bodymap') {
      window.appNav.switchTab('bodymap');
    }

    // 2. Update Transcript HUD Box
    const transcriptEl = document.getElementById('voice-transcript-text');
    if (transcriptEl) {
      transcriptEl.innerHTML = `
        <div class="matched-voice-pill">
          <span class="pulse-ring"></span>
          <span class="matched-icon">${card.icon}</span>
          <span class="matched-text">
            <strong>${isHi ? 'पहचाना गया:' : 'Recognized:'}</strong> "${spokenText}" ➔ 
            <span class="matched-highlight">${cardTitle}</span>
          </span>
        </div>
      `;
    }

    // 3. Highlight the target card with neon strobe
    const cards = document.querySelectorAll('.comm-card');
    cards.forEach(c => c.classList.remove('voice-matched-card', 'flash-active'));

    const targetCard = cards[card.index];
    if (targetCard) {
      targetCard.classList.add('voice-matched-card', 'flash-active');
      try {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}

      clearTimeout(this.activeCardTimeout);
      this.activeCardTimeout = setTimeout(() => {
        targetCard.classList.remove('voice-matched-card', 'flash-active');
      }, 3500);
    }

    // 4. Announce Aloud via Medical Audio Alarm (Dual-Language Indian English + Hindi)
    if (window.medicalAlarm) {
      window.medicalAlarm.speakPatientRequest(card.msgEn, card.msgHi);
    }

    // 5. Show Notification Toast
    if (window.appNav) {
      const toastText = isHi
        ? `🎙️ वॉयस कमांड: "${card.nameHi}" (${spokenText})`
        : `🎙️ Voice Command: "${card.nameEn}" (${spokenText})`;
      window.appNav.showToast(toastText);
    }

    // 6. Dispatch Alert to Central Nurse Station Log
    if (window.nurseDashboard) {
      window.nurseDashboard.logIncident(7.8, `VOICE_ASSIST [${card.id.toUpperCase()}]: ${card.msgEn}`);
    }
  }

  /**
   * One-click simulation of spoken phrases (Guaranteed fail-safe for exhibitions)
   */
  simulateSpeech(phrase) {
    const transcriptEl = document.getElementById('voice-transcript-text');
    if (transcriptEl) {
      const isHi = window.translator && window.translator.currentLang === 'hi';
      transcriptEl.innerHTML = `<span class="sim-text">🗣️ <strong>${isHi ? '[सिम्युलेटेड वॉयस]:' : '[Voice Simulation]:'}</strong> "${phrase}"</span>`;
    }
    // Set isSimulation = true to bypass any TTS acoustic feedback lock
    this.processSpokenTranscript(phrase, true);
  }

  /**
   * Updates UI state elements (buttons, badges, indicators)
   */
  updateUIState(overrideState = null) {
    const isHi = window.translator && window.translator.currentLang === 'hi';
    const toggleBtn = document.getElementById('btn-toggle-voice');
    const btnLabel = document.getElementById('voice-btn-label');
    const statusBadge = document.getElementById('voice-status-badge');
    const statusText = document.getElementById('voice-status-text');

    if (overrideState === 'permission-denied') {
      if (statusBadge) statusBadge.className = 'voice-status-badge error';
      if (statusText) statusText.innerText = isHi ? 'माइक अनुमति अस्वीकृत (नीचे डेमो चिप्स का प्रयोग करें)' : 'Mic Access Denied (Use Demo Chips Below)';
      if (toggleBtn) toggleBtn.classList.remove('active', 'btn-danger');
      if (btnLabel) btnLabel.innerText = isHi ? '🎙️ वॉयस असिस्टेंट शुरू करें' : '🎙️ Start Voice Assistive Mode';
      return;
    }

    if (overrideState === 'network-error') {
      if (statusBadge) statusBadge.className = 'voice-status-badge warning';
      if (statusText) statusText.innerText = isHi ? 'नेटवर्क सूचना (डेमो चिप्स उपलब्ध)' : 'Voice Network Notice (Demo Chips Ready)';
      return;
    }

    if (!this.isSupported || overrideState === 'unsupported') {
      if (statusBadge) statusBadge.className = 'voice-status-badge warning';
      if (statusText) statusText.innerText = isHi ? 'डेमो मोड (क्विक चिप्स उपलब्ध)' : 'Demo Mode (Quick Chips Available)';
      if (btnLabel) btnLabel.innerText = isHi ? '🎙️ वॉयस डेमो चिप्स' : '🎙️ Voice Demo Chips';
      return;
    }

    if (this.isListening || overrideState === 'listening') {
      if (statusBadge) statusBadge.className = 'voice-status-badge listening';
      if (statusText) statusText.innerText = isHi ? 'सुन रहा है... हिन्दी या अंग्रेजी में बोलें...' : 'Listening... Speak in Hindi or English...';
      if (toggleBtn) {
        toggleBtn.classList.add('active', 'btn-danger');
        toggleBtn.classList.remove('btn-primary');
      }
      if (btnLabel) btnLabel.innerText = isHi ? '🔴 माइक्रोफोन बंद करें' : '🔴 Stop Listening';
    } else {
      if (statusBadge) statusBadge.className = 'voice-status-badge standby';
      if (statusText) statusText.innerText = isHi ? 'माइक स्टैंडबाय • सुनने के लिए तैयार' : 'Mic Standby • Ready to Listen';
      if (toggleBtn) {
        toggleBtn.classList.remove('active', 'btn-danger');
        toggleBtn.classList.add('btn-primary');
      }
      if (btnLabel) btnLabel.innerText = isHi ? '🎙️ वॉयस असिस्टेंट शुरू करें' : '🎙️ Start Voice Assistive Mode';
    }
  }
}

// Global Singleton
window.voiceAssistant = new VoiceAssistiveEngine();
