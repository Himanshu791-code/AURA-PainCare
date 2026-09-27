/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Audio & Spoken Voice Alert Engine (Synthesized Chime + Natural Speech Voice Broadcast)
 */

class MedicalAudioAlarm {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.isManualTest = false;
    this.loopTimeout = null;
    this.speechTimeout = null;
    this.activeSeverity = 'none';
    this.isRespiratoryAlarm = false;
    this.currentBed = '104';
    this.currentPatientName = 'Rajesh Verma';
    this.currentAudioElement = null;
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];

    // Pre-cache voices when available
    if (this.speechSynth) {
      this.voices = this.speechSynth.getVoices() || [];
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = () => {
          this.voices = this.speechSynth.getVoices() || [];
        };
      }
    }
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.speechSynth && this.speechSynth.paused) {
      try { this.speechSynth.resume(); } catch (e) {}
    }
  }

  playTone(freq, duration = 0.12, type = 'sine', startTime = 0) {
    this.initContext();
    if (this.isMuted || !this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);

      const attackTime = 0.015;
      const releaseTime = duration - 0.02;

      gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.35, this.audioCtx.currentTime + startTime + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + startTime + releaseTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(this.audioCtx.currentTime + startTime);
      osc.stop(this.audioCtx.currentTime + startTime + duration);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  playHighPriorityChime() {
    if (this.isMuted) return;
    this.initContext();

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99];
    const spacing = 0.13;

    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.11, 'triangle', idx * spacing);
    });
  }

  /**
   * Identifies the best available voice prioritizing Indian English and native Hindi
   */
  getBestVoice(targetLang) {
    if (!this.speechSynth) return null;
    if (!this.voices || this.voices.length === 0) {
      this.voices = this.speechSynth.getVoices() || [];
    }
    const voices = this.voices || [];
    if (voices.length === 0) return null;

    if (targetLang === 'en-IN') {
      // Priority 1: Indian English specific locale and known Indian voice names
      const inVoice = voices.find(v => {
        const lang = (v.lang || '').replace('_', '-').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang === 'en-in' || 
               name.includes('india') || 
               name.includes('neerja') || 
               name.includes('prabhat') || 
               name.includes('heera') || 
               name.includes('ravi') || 
               name.includes('veena');
      });
      if (inVoice) return inVoice;

      // Priority 2: British English (sounds formal, articulate, and very clear in Indian clinical settings)
      const gbVoice = voices.find(v => {
        const lang = (v.lang || '').replace('_', '-').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang === 'en-gb' || name.includes('hazel') || name.includes('george') || name.includes('uk');
      });
      if (gbVoice) return gbVoice;

      // Priority 3: Any clear English voice
      const anyEn = voices.find(v => (v.lang || '').toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;
    }

    if (targetLang === 'hi-IN') {
      // Priority 1: Native Hindi voices
      const hiVoice = voices.find(v => {
        const lang = (v.lang || '').replace('_', '-').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang.startsWith('hi') || 
               name.includes('hindi') || 
               name.includes('kalpana') || 
               name.includes('swara') || 
               name.includes('madhur') || 
               name.includes('hemant');
      });
      if (hiVoice) return hiVoice;

      // Note: Do not return an English voice here for hi-IN!
      // Returning null allows browser's built-in Hindi engine to synthesize Devanagari text.
      return null;
    }

    return null;
  }

  /**
   * Checks if browser/OS has a native Hindi TTS voice installed
   */
  hasNativeHindiVoice() {
    if (!this.speechSynth) return false;
    if (!this.voices || this.voices.length === 0) {
      this.voices = this.speechSynth.getVoices() || [];
    }
    const voices = this.speechSynth.getVoices() || this.voices || [];
    return voices.some(v => {
      const lang = (v.lang || '').replace('_', '-').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return lang.startsWith('hi') || 
             name.includes('hindi') || 
             name.includes('kalpana') || 
             name.includes('swara') || 
             name.includes('madhur') ||
             name.includes('google हिन्दी');
    });
  }

  /**
   * Speaks a single utterance with tuned Indian accent modulation
   */
  speakUtterance(text, targetLang, callback, errorCallback) {
    if (!this.speechSynth || this.isMuted) {
      if (callback) callback();
      return;
    }

    if (typeof SpeechSynthesisUtterance === 'undefined') {
      if (callback) callback();
      return;
    }

    // Refresh voices dynamically
    if (!this.voices || this.voices.length === 0) {
      this.voices = this.speechSynth.getVoices() || [];
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getBestVoice(targetLang);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || targetLang;
    } else {
      utterance.lang = targetLang;
    }

    // Voice modulation tuning:
    // Rate tuned a little bit faster as requested ("speed bhot slow little bit fast kro"):
    // English: 1.08 (fast, crisp, authoritative, clear alert)
    // Hindi: 1.05 (fast, natural, fluent Hindi cadence)
    utterance.rate = targetLang === 'hi-IN' ? 1.05 : 1.08;
    utterance.pitch = 1.00;
    utterance.volume = 1.00;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (callback) callback();
    };

    utterance.onend = finish;
    utterance.onerror = (e) => {
      console.warn('[AURA Audio] Speech synthesis error:', e);
      if (errorCallback && !finished) {
        finished = true;
        errorCallback(e);
      } else {
        finish();
      }
    };

    // Safety timeout in case browser TTS event stalls
    const timeoutMs = Math.max(3000, (text.length * 75) + 1000);
    setTimeout(() => {
      if (!finished) finish();
    }, timeoutMs);

    try {
      this.speechSynth.speak(utterance);
    } catch (err) {
      console.warn('[AURA Audio] speak exception:', err);
      finish();
    }
  }

  /**
   * Plays a pre-recorded audio file with custom speed, with fallback callback on error
   */
  playAudioFile(src, playbackRate = 1.06, callback, errorCallback) {
    if (this.isMuted) {
      if (callback) callback();
      return;
    }

    try {
      this.stopCurrentAudio();
      const audio = new Audio(src);
      this.currentAudioElement = audio;
      audio.playbackRate = playbackRate;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (this.currentAudioElement === audio) {
          this.currentAudioElement = null;
        }
        if (callback) callback();
      };

      const onError = (e) => {
        if (finished) return;
        finished = true;
        if (this.currentAudioElement === audio) {
          this.currentAudioElement = null;
        }
        console.warn('[AURA Audio] Audio file playback failed, falling back to TTS:', src, e);
        if (errorCallback) errorCallback(e);
        else finish();
      };

      audio.onended = finish;
      audio.onerror = onError;

      // 15s watchdog so audio never permanently locks the state
      setTimeout(() => {
        if (!finished) {
          try { audio.pause(); } catch (err) {}
          finish();
        }
      }, 15000);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          onError(err);
        });
      }
    } catch (e) {
      if (errorCallback) errorCallback(e);
      else if (callback) callback();
    }
  }

  stopCurrentAudio() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
  }

  /**
   * Sequential Dual-Language Broadcast:
   * First speaks in Indian English, then speaks ONE TIME in Hindi!
   * Seamlessly utilizes high-fidelity pre-rendered clinical audio files with instant speech synthesis fallback.
   */
  speakBilingualSequence(enText, hiDevanagari, hiHinglish, callback, enAudioSrc = null, hiAudioSrc = null) {
    if (this.isMuted) {
      this.isBroadcasting = false;
      if (callback) callback();
      return;
    }

    this.isBroadcasting = true;

    // Safety watchdog: 20 seconds ensures ample time for both languages
    clearTimeout(this.broadcastingSafetyTimeout);
    this.broadcastingSafetyTimeout = setTimeout(() => {
      this.isBroadcasting = false;
    }, 20000);

    // Stop previous audio or speech
    this.stopCurrentAudio();
    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
        if (this.speechSynth.paused) this.speechSynth.resume();
      } catch (e) {}
      this.voices = this.speechSynth.getVoices() || [];
    }

    // STEP 1: Speak in Indian English first (Speed: 1.08)
    const playEnglish = (onEnDone) => {
      if (!this.isBroadcasting || this.isMuted) {
        onEnDone();
        return;
      }
      if (enAudioSrc) {
        this.playAudioFile(enAudioSrc, 1.08, onEnDone, () => {
          // If audio file blocked, fallback to speech synthesis
          this.speakUtterance(enText, 'en-IN', onEnDone);
        });
      } else {
        this.speakUtterance(enText, 'en-IN', onEnDone);
      }
    };

    // STEP 2: Speak ONE TIME in Hindi immediately after Indian English (Speed: 1.06)
    const playHindi = (onHiDone) => {
      if (!this.isBroadcasting || this.isMuted) {
        onHiDone();
        return;
      }
      if (hiAudioSrc) {
        this.playAudioFile(hiAudioSrc, 1.06, onHiDone, () => {
          // Fallback to native Devanagari Hindi via SpeechSynthesis
          this.speakUtterance(hiDevanagari, 'hi-IN', onHiDone, () => {
            if (hiHinglish && this.isBroadcasting) {
              this.speakUtterance(hiHinglish, 'en-IN', onHiDone);
            } else {
              onHiDone();
            }
          });
        });
      } else {
        this.speakUtterance(hiDevanagari, 'hi-IN', onHiDone, () => {
          if (hiHinglish && this.isBroadcasting) {
            this.speakUtterance(hiHinglish, 'en-IN', onHiDone);
          } else {
            onHiDone();
          }
        });
      }
    };

    // Execute Sequence
    playEnglish(() => {
      if (!this.isBroadcasting || this.isMuted) {
        this.isBroadcasting = false;
        if (callback) callback();
        return;
      }

      // Natural 280ms clinical pause between Indian English and Hindi
      this.speechTimeout = setTimeout(() => {
        if (!this.isBroadcasting || this.isMuted) {
          this.isBroadcasting = false;
          if (callback) callback();
          return;
        }

        // Play Hindi ONE TIME
        playHindi(() => {
          this.isBroadcasting = false;
          if (callback) callback();
        });
      }, 280);
    });
  }

  /**
   * Looks up English and Hindi names for the bed from the clinical database
   */
  getPatientNames(bed, defaultName = 'Rajesh Verma') {
    let nameEn = defaultName;
    let nameHi = defaultName;

    if (typeof window !== 'undefined' && window.PATIENT_WARD_DATABASE) {
      const patient = window.PATIENT_WARD_DATABASE.find(p => String(p.bed) === String(bed));
      if (patient) {
        nameEn = patient.name || defaultName;
        nameHi = patient.nameHi || patient.name || defaultName;
      }
    }
    return { nameEn, nameHi };
  }

  /**
   * Acute Pain Emergency Alert (Dual-Language: Indian English followed by Hindi)
   */
  broadcastUrgentVoiceAlert(bed = '104', patientName = 'Rajesh Verma', onComplete = null) {
    this.currentBed = bed;
    this.currentPatientName = patientName;
    const names = this.getPatientNames(bed, patientName);

    // Pre-alarm high attention chime
    this.playHighPriorityChime();

    // Indian English announcement (Speaks 1st, Speed: 1.08)
    const enText = `Attention! Bed ${bed}, patient ${names.nameEn} is in acute pain! Attending nurse, please respond immediately!`;

    // Hindi announcement (Speaks ONE TIME after English, Speed: 1.06)
    const hiDevanagari = `सावधान! बेड नंबर ${bed} पर मरीज ${names.nameHi} को तीव्र दर्द हो रहा है! ड्यूटी नर्स तुरंत पहुंचे!`;

    // Phonetic Hinglish fallback
    const hiHinglish = `Saavdhan! Bed number ${bed} par mareez ${names.nameEn} ko teevra dard ho raha hai! Duty nurse turant pahunchein!`;

    // Pre-rendered studio audio files for Bed 104
    const enAudio = (String(bed) === '104') ? 'audio/alarm_acute_pain_en.mp3' : null;
    const hiAudio = (String(bed) === '104') ? 'audio/alarm_acute_pain_hi.mp3' : null;

    setTimeout(() => {
      this.speakBilingualSequence(enText, hiDevanagari, hiHinglish, onComplete, enAudio, hiAudio);
    }, 350);
  }

  /**
   * Acute Respiratory Distress / Code Blue Alert (Dual-Language: Indian English followed by Hindi)
   */
  broadcastRespiratoryEmergencyAlert(bed = '104', patientName = 'Rajesh Verma', onComplete = null) {
    this.currentBed = bed;
    this.currentPatientName = patientName;
    const names = this.getPatientNames(bed, patientName);

    // Pre-alarm high attention chime
    this.playHighPriorityChime();

    // Indian English announcement (Speaks 1st, Speed: 1.08)
    const enText = `Emergency Code Blue! Bed ${bed}, patient ${names.nameEn} is in critical respiratory distress! Airway intervention required!`;

    // Hindi announcement (Speaks ONE TIME after English, Speed: 1.06)
    const hiDevanagari = `इमरजेंसी कोड ब्लू! बेड नंबर ${bed} पर मरीज ${names.nameHi} को सांस लेने में गंभीर कष्ट हो रहा है! रेस्पिरेटरी टीम तुरंत पहुंचे!`;

    // Phonetic Hinglish fallback
    const hiHinglish = `Emergency Code Blue! Bed number ${bed} par mareez ${names.nameEn} ko saans lene mein gambhir kasht ho raha hai! Respiratory team turant pahunchein!`;

    // Pre-rendered studio audio files for Bed 104
    const enAudio = (String(bed) === '104') ? 'audio/alarm_code_blue_en.mp3' : null;
    const hiAudio = (String(bed) === '104') ? 'audio/alarm_code_blue_hi.mp3' : null;

    setTimeout(() => {
      this.speakBilingualSequence(enText, hiDevanagari, hiHinglish, onComplete, enAudio, hiAudio);
    }, 350);
  }

  /**
   * Starts sustained repeating voice alarm loop with zero audio collision
   */
  startAlarm(severity = 'severe', bed = '104', patientName = 'Rajesh Verma', isRespiratory = false) {
    this.initContext();
    this.activeSeverity = severity;
    this.isRespiratoryAlarm = isRespiratory;
    this.currentBed = bed;
    this.currentPatientName = patientName;

    if (this.isPlaying) return;
    this.isPlaying = true;

    const triggerBroadcastCycle = () => {
      if (!this.isPlaying || this.isMuted) return;

      const onCycleComplete = () => {
        // Wait 3.5 seconds after both English + Hindi finish before repeating
        if (this.isPlaying && !this.isMuted) {
          this.loopTimeout = setTimeout(triggerBroadcastCycle, 3500);
        }
      };

      if (this.isRespiratoryAlarm) {
        this.broadcastRespiratoryEmergencyAlert(this.currentBed, this.currentPatientName, onCycleComplete);
      } else {
        this.broadcastUrgentVoiceAlert(this.currentBed, this.currentPatientName, onCycleComplete);
      }
    };

    triggerBroadcastCycle();
  }

  stopAlarm() {
    this.isPlaying = false;
    this.isBroadcasting = false;
    this.activeSeverity = 'none';
    this.isManualTest = false;

    clearTimeout(this.loopTimeout);
    clearTimeout(this.speechTimeout);
    clearTimeout(this.broadcastingSafetyTimeout);
    this.loopTimeout = null;
    this.speechTimeout = null;
    this.broadcastingSafetyTimeout = null;

    this.stopCurrentAudio();

    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch (e) {}
    }
  }

  acknowledge() {
    this.stopAlarm();
    this.playTone(880, 0.08, 'sine', 0);
  }

  /**
   * Direct manual test for evaluators
   */
  testSound() {
    this.initContext();
    this.isManualTest = true;
    this.broadcastUrgentVoiceAlert('104', 'Rajesh Verma', () => {
      this.isManualTest = false;
    });
  }

  /**
   * Helper to map English patient requests to phonetic Hinglish for resilient speech
   */
  getHinglishPatientRequest(requestEn) {
    const textLower = (requestEn || '').toLowerCase();
    if (textLower.includes('water')) return 'Mareez ko peene ke liye paani chahiye';
    if (textLower.includes('pain') || textLower.includes('spasm')) return 'Emergency! Mareez ko asahaniya tez dard ho raha hai';
    if (textLower.includes('breath') || textLower.includes('airway')) return 'Critical! Mareez ko saans lene mein atyadhik takleef ho rahi hai';
    if (textLower.includes('position') || textLower.includes('posture')) return 'Mareez ko karwat ya sthiti badalni hai';
    if (textLower.includes('doctor') || textLower.includes('physician')) return 'Zaroori! Doctor ko turant bulaayein';
    if (textLower.includes('cold') || textLower.includes('blanket')) return 'Mareez ko thand lag rahi hai, kambal chahiye';
    if (textLower.includes('suction') || textLower.includes('mucus')) return 'Mareez ko kaph saaf karne aur suction ki zaroorat hai';
    if (textLower.includes('nurse') || textLower.includes('anxiety') || textLower.includes('family')) return 'Mareez ko ghabrahat ho rahi hai, nurse ki upasthiti chahiye';
    return null;
  }

  /**
   * Speaks non-verbal patient request in Indian English followed by one time in Hindi
   */
  speakPatientRequest(requestEn, requestHi, requestHinglish = null) {
    this.initContext();
    this.playTone(659.25, 0.12, 'sine', 0);

    const enText = `Bed 104 request: ${requestEn}.`;
    const hiDevanagari = `बेड 104: ${requestHi}.`;
    const fallbackHinglish = requestHinglish || this.getHinglishPatientRequest(requestEn);
    const hiHinglish = fallbackHinglish ? `Bed 104: ${fallbackHinglish}.` : hiDevanagari;

    // Match to pre-recorded studio audio files
    const textLower = (requestEn || '').toLowerCase();
    let enAudio = null;
    let hiAudio = null;

    if (textLower.includes('water')) {
      enAudio = 'audio/request_water_en.mp3';
      hiAudio = 'audio/request_water_hi.mp3';
    } else if (textLower.includes('pain') || textLower.includes('spasm')) {
      enAudio = 'audio/request_pain_en.mp3';
      hiAudio = 'audio/request_pain_hi.mp3';
    } else if (textLower.includes('breath') || textLower.includes('airway')) {
      enAudio = 'audio/request_breathing_en.mp3';
      hiAudio = 'audio/request_breathing_hi.mp3';
    } else if (textLower.includes('position') || textLower.includes('posture')) {
      enAudio = 'audio/request_position_en.mp3';
      hiAudio = 'audio/request_position_hi.mp3';
    } else if (textLower.includes('doctor') || textLower.includes('physician')) {
      enAudio = 'audio/request_doctor_en.mp3';
      hiAudio = 'audio/request_doctor_hi.mp3';
    } else if (textLower.includes('cold') || textLower.includes('blanket')) {
      enAudio = 'audio/request_blanket_en.mp3';
      hiAudio = 'audio/request_blanket_hi.mp3';
    } else if (textLower.includes('suction') || textLower.includes('mucus')) {
      enAudio = 'audio/request_suction_en.mp3';
      hiAudio = 'audio/request_suction_hi.mp3';
    } else if (textLower.includes('nurse') || textLower.includes('anxiety') || textLower.includes('family')) {
      enAudio = 'audio/request_nurse_en.mp3';
      hiAudio = 'audio/request_nurse_hi.mp3';
    }

    setTimeout(() => {
      this.speakBilingualSequence(enText, hiDevanagari, hiHinglish, null, enAudio, hiAudio);
    }, 200);
  }
}

window.medicalAlarm = new MedicalAudioAlarm();
