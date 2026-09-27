# AURA-PainCare: AI Silent-Pain & Distress Monitoring System
> **Autonomous, Zero-Hardware Computer Vision for Non-Verbal & Critically Ill Patients**

---

## 1. Executive Summary & Clinical Need
In modern Intensive Care Units (ICUs), post-anesthesia recovery rooms (PACU), and stroke wards, patients frequently endure acute physical pain and hemodynamic distress while being completely unable to speak, cry out, or push a call button due to:
- Endotracheal intubation and mechanical ventilation
- Post-operative sedation or paralysis
- Stroke-induced motor/speech deficits (aphasia)
- Pediatric or neurological non-verbal states

Standard hospital care relies on **periodic intermittent nurse check-ups (every 1–2 hours)**. Between these rounds, silent patients remain in undetected distress, resulting in dangerous hypertensive spikes, tachycardia, prolonged recovery times, and psychological trauma.

**AURA-PainCare** transforms any standard laptop, tablet, or bedside monitor with an ordinary webcam into a **24/7 continuous autonomous pain monitoring system** at **₹0 additional hardware cost**.

---

## 2. Core Modules

### 📷 Module A: Real-Time AI Facial Pain Index
- **Continuous 468 3D Landmark Tracking**: Uses high-performance computer vision to capture involuntary facial micro-expressions.
- **Facial Action Coding System (FACS) Biomarkers**:
  - **AU4 (Brow Lowerer / Corrugator Furrowing)**: Inward and downward contraction of eyebrows.
  - **AU6/7 (Orbital Squint & Eyelid Tightener)**: Narrowing of the eye aperture (Eye Aspect Ratio reduction).
  - **AU9/10 (Mid-Face Distress / Levator Contraction)**: Shortening between nose bridge and upper lip.
  - **AU25/27 (Mouth Opening / Grimace / Jaw Strain)**: Horizontal and vertical mouth distortion.
- **Clinical Pain Score (0.0 to 10.0)**:
  - `0.0 – 2.9`: **Mild / Routine** (Green)
  - `3.0 – 5.9`: **Moderate Pain** (Yellow/Amber – Observation)
  - `6.0 – 8.9`: **Severe Pain** (Orange – High-Priority Nurse Alert!)
  - `9.0 – 10.0`: **Critical Distress** (Red Flashing – Emergency Code!)

### 📍 Module B: Non-Verbal Body Pain Location Map
- Interactive anatomical human body diagram (Head, Chest, Abdomen, Spine, Arms, Legs).
- Allows non-verbal patients or attending nurses to mark the exact locus of distress via touch, gaze, or pointer.
- Instantly transmits the targeted anatomical location to the central Nurse Station.

### 🚨 Module C: Central Nurse Station & Alert Engine
- **IEC 60601-1-8 Medical Chime Synthesizer**: Authentic multi-tone high-priority alert chime generated via Web Audio API.
- **Flashing Emergency Alarm Strobe**: Visual alert with bed assignment, pain score, and active pain site.
- **Dynamic 60-Second Real-Time Trend Graph**: Continuous scrolling canvas tracking pain score fluctuations against the 6.0 critical threshold.
- **Hemodynamic Vital Correlation**: Real-time correlation with Heart Rate (BPM), SpO2 (%), and Respiration Rate.
- **Sustained Filter**: Requires $\ge 1.2\text{s}$ of continuous facial distress to eliminate false positives from sneezes, yawns, or natural blinks.
- **Incident History & Acknowledgement**: Logs all alarm events with timestamp, severity, locus, and staff nurse response latency (<10s SLA).

---

## 3. How to Run the Prototype (Quick Start)

### Option 1: One-Click Windows Launcher (Easiest)
Simply double-click the file:
```
START_AURA_PAINCARE.bat
```
This automatically starts the local server and opens the application in your default web browser (Chrome / Edge).

### Option 2: Run with Python Terminal
Open PowerShell or Command Prompt in the `aura_paincare` folder:
```bash
python python\app.py
```
Then navigate to:
```
http://127.0.0.1:8000/index.html
```

### Option 3: Direct Browser Launch (No Server Needed)
You can directly open `index.html` in Google Chrome, Microsoft Edge, or Brave.

---

## 4. Key Interactive Demonstration Features

1. **Live Camera Facial Expression Testing**:
   - Click `▶ Start Camera`. Allow browser camera permissions.
   - Furrow your eyebrows and squint your eyes tightly to simulate pain.
   - Watch the **AU4 Brow** and **AU6/7 Squint** bars increase dynamically.
   - When the score crosses **6.0/10** for more than 1.2 seconds, the **medical chime rings out** and the **red emergency banner flashes**!
2. **Clinical Demonstration Presets**:
   - `Patient Resting (1.2)`: Simulates calm post-op baseline.
   - `Sudden Spasm (7.6)`: Triggers immediate severe alert with abdomen location.
   - `Critical Grimace (9.5)`: Triggers high-priority emergency distress with cardiac location.
   - `Return to Live AI`: Resets simulation and returns to live webcam tracking.
3. **Clinical AI Calibration & Threshold Tuner**:
   - Click `⚙️ Threshold Calibrator` to fine-tune emergency trigger threshold (4.0–8.0), sustained duration filter (0.5s–3.0s), and individual AU weight coefficients. Includes 4 one-click presets (*Standard ICU*, *Post-Op Acute*, *Pediatric FLACC*, *Fast-Demo*).
4. **🌙 Night / IR Vision Simulation**:
   - Toggle night mode to test low-light high-contrast edge enhancement in dark post-op recovery rooms.
5. **Real-Time Nurse Response SLA Stopwatch**:
   - Live millisecond counter during active alarms to verify hospital response SLA (<10.0s target).
6. **10-Bed Central ICU Ward Triage & Case Registry**:
   - Simultaneous surveillance across 10 high-acuity beds (Beds 101 to 110) with triage filter chips (*All*, *Critical*, *Severe*, *Observation*).
7. **Bilingual Toggle**:
   - Click `हिन्दी (Hindi)` in the top right to instantly translate all clinical terminology into clear Hindi.
8. **7-Slide Vigyan Mela Innovation Presentation Deck**:
   - Complete built-in pitch deck with Fullscreen mode (`F`) covering clinical crisis, FACS mathematics, 94.2% validation metrics, and Ayushman Bharat (ABDM) national integration.

---

## 5. System Architecture
```
Layer 1: Input Stream       ──> Standard HD Webcam / Tablet Camera (30-60 FPS)
Layer 2: Vision AI Engine   ──> 468 3D Landmark Mesh + FACS Action Unit Extractor + Night/IR Filter
Layer 3: UI & Alert Engine  ──> Glassmorphic ICU Dashboard + Web Audio Chime + Body Map + SLA Stopwatch
Layer 4: Deployment         ──> Zero-Hardware Pure Software (Runs on any standard PC or Browser)
```
