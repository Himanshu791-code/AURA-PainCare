/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Module B: Non-Verbal Anatomical Body Pain Locator Map
 */

class BodyPainMap {
  constructor() {
    this.activeZone = null;
    this.zones = {
      'head': {
        nameEn: 'Head / Cranial',
        nameHi: 'सिर / मस्तिष्क (Cranial)',
        descEn: 'Severe headache, migraine, post-trauma cranial distress',
        descHi: 'गंभीर सिरदर्द, माइग्रेन, पोस्ट-ट्रॉमा दर्द'
      },
      'chest': {
        nameEn: 'Chest / Thorax (Cardiac)',
        nameHi: 'छाती / हृदय (Cardiac)',
        descEn: 'Angina, post-sternotomy, cardiac or respiratory tightness',
        descHi: 'सीने में दर्द, सांस लेने में तकलीफ, हृदय दबाव'
      },
      'abdomen': {
        nameEn: 'Abdomen / Epigastric',
        nameHi: 'पेट / उदर (Abdominal)',
        descEn: 'Post-laparotomy, visceral spasm, severe gastric distress',
        descHi: 'पेट में ऐंठन, सर्जरी के बाद पेट में तेज दर्द'
      },
      'spine': {
        nameEn: 'Spine / Lumbar Back',
        nameHi: 'रीढ़ / कमर (Lumbar Spine)',
        descEn: 'Postural spasm, spinal trauma, radiculopathy',
        descHi: 'रीढ़ की हड्डी या पीठ के निचले हिस्से में दर्द'
      },
      'arm-l': {
        nameEn: 'Left Upper Extremity (Arm)',
        nameHi: 'बायां हाथ / बाजू',
        descEn: 'Post-cannula pain, radiating cardiac pain, fracture',
        descHi: 'बाएं हाथ में दर्द या सुन्नपन'
      },
      'arm-r': {
        nameEn: 'Right Upper Extremity (Arm)',
        nameHi: 'दायां हाथ / बाजू',
        descEn: 'Post-operative cannula site, localized limb ache',
        descHi: 'दाएं हाथ में दर्द या तनाव'
      },
      'leg-l': {
        nameEn: 'Left Lower Extremity (Leg)',
        nameHi: 'बायां पैर / टांग',
        descEn: 'Deep vein thrombosis (DVT) ache, calf spasm',
        descHi: 'बाएं पैर या पिंडली में दर्द'
      },
      'leg-r': {
        nameEn: 'Right Lower Extremity (Leg)',
        nameHi: 'दायां पैर / टांग',
        descEn: 'Post-op orthopedic incision, limb spasm',
        descHi: 'दाएं पैर में दर्द या मोच'
      }
    };
  }

  init() {
    // Bind SVG zone clicks
    document.querySelectorAll('.body-zone').forEach(zone => {
      zone.addEventListener('click', (e) => {
        const zoneId = e.currentTarget.getAttribute('data-zone');
        this.selectZone(zoneId);
      });
    });

    // Bind quick tag buttons
    document.querySelectorAll('.locus-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const zoneId = e.currentTarget.getAttribute('data-zone');
        this.selectZone(zoneId);
      });
    });
  }

  selectZone(zoneId, isAiAutoDetected = false, detectionReason = '') {
    if (!this.zones[zoneId]) return;

    this.activeZone = zoneId;
    this.isAutoDetected = isAiAutoDetected;
    this.detectionReason = detectionReason;

    // Highlight SVG element
    document.querySelectorAll('.body-zone').forEach(z => {
      if (z.getAttribute('data-zone') === zoneId) {
        z.classList.add('active');
        if (isAiAutoDetected) z.classList.add('ai-auto-zone');
        else z.classList.remove('ai-auto-zone');
      } else {
        z.classList.remove('active', 'ai-auto-zone');
      }
    });

    // Highlight buttons
    document.querySelectorAll('.locus-btn').forEach(b => {
      if (b.getAttribute('data-zone') === zoneId) {
        b.classList.add('selected');
      } else {
        b.classList.remove('selected');
      }
    });

    // Update Display Card
    this.updateDisplay();

    // Broadcast to Nurse Dashboard
    if (window.nurseDashboard) {
      window.nurseDashboard.onPainLocationChanged(this.getActiveLocusName());
    }
  }

  getActiveLocusName() {
    if (!this.activeZone || !this.zones[this.activeZone]) {
      return window.translator ? window.translator.get('noneSelected') : 'Unspecified';
    }
    const isHi = window.translator && window.translator.currentLang === 'hi';
    return isHi ? this.zones[this.activeZone].nameHi : this.zones[this.activeZone].nameEn;
  }

  updateDisplay() {
    const nameEl = document.getElementById('active-locus-name');
    const descEl = document.getElementById('active-locus-desc');
    const expNameEl = document.getElementById('expanded-locus-name');
    const expDescEl = document.getElementById('expanded-locus-desc');
    const aiIndicator = document.getElementById('ai-locus-indicator');

    const defaultTitle = window.translator ? window.translator.get('noneSelected') : 'Diffuse Distress';
    const defaultDesc = 'Autonomous AI vision is actively tracking anatomical distress';

    if (!this.activeZone || !this.zones[this.activeZone]) {
      if (nameEl) nameEl.innerText = defaultTitle;
      if (descEl) descEl.innerText = defaultDesc;
      if (expNameEl) expNameEl.innerText = defaultTitle;
      if (expDescEl) expDescEl.innerText = defaultDesc;
      if (aiIndicator) {
        aiIndicator.innerText = '🤖 AI Vision Locus: Scanning 468 Landmarks...';
        aiIndicator.className = 'ai-locus-indicator status-scanning';
      }
      return;
    }

    const isHi = window.translator && window.translator.currentLang === 'hi';
    const zoneInfo = this.zones[this.activeZone];
    const locusName = isHi ? zoneInfo.nameHi : zoneInfo.nameEn;
    const locusDesc = isHi ? zoneInfo.descHi : zoneInfo.descEn;

    if (nameEl) nameEl.innerText = locusName;
    if (descEl) descEl.innerText = locusDesc;
    if (expNameEl) expNameEl.innerText = locusName;
    if (expDescEl) expDescEl.innerText = locusDesc;

    if (aiIndicator) {
      if (this.isAutoDetected) {
        const reasonText = this.detectionReason ? ` • ${this.detectionReason}` : '';
        aiIndicator.innerText = isHi 
          ? `🤖 AI ऑटो-डिटेक्टेड स्थान: ${locusName}${reasonText}` 
          : `🤖 AI Auto-Detected Locus: ${locusName}${reasonText}`;
        aiIndicator.className = 'ai-locus-indicator status-auto-locked';
      } else {
        aiIndicator.innerText = isHi 
          ? `👆 मरीज/नर्स द्वारा चुना गया: ${locusName}` 
          : `👆 Manual Selection: ${locusName}`;
        aiIndicator.className = 'ai-locus-indicator status-manual';
      }
    }
  }

  clear() {
    this.activeZone = null;
    document.querySelectorAll('.body-zone').forEach(z => z.classList.remove('active'));
    document.querySelectorAll('.locus-btn').forEach(b => b.classList.remove('selected'));
    this.updateDisplay();
  }
}

window.bodyPainMap = new BodyPainMap();
