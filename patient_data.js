/**
 * AURA-PainCare: AI Silent-Pain & Distress Monitor
 * Clinical Ward Dataset: 7 Pre-Fed High-Acuity ICU / Post-Op Patient Case Profiles
 */

const PATIENT_WARD_DATABASE = [
  {
    bed: "104",
    isLiveFeed: true,
    name: "Rajesh Verma",
    nameHi: "राजेश वर्मा",
    age: 54,
    gender: "Male",
    admissionId: "IPD-2026-9041",
    admissionDate: "2026-09-15 08:30",
    ward: "Intensive Surgical Recovery (ICU-A)",
    doctor: "Dr. Arvind Mehta (MS, General Surgery)",
    diagnosis: "Post-Operative Exploratory Laparotomy (Perforated Appendix)",
    diagnosisHi: "पेट की सर्जरी (परफोरेटेड अपेंडिक्स लैप्रोटॉमी)",
    nonVerbalReason: "Endotracheal Intubation & Mechanical Ventilation (Sedated)",
    nonVerbalReasonHi: "वेंटिलेटर और एंडोट्रेकियल ट्यूब (बोलने में असमर्थ)",
    painScore: 7.8, // Active live feed will override
    severity: "severe",
    status: "CRITICAL_MONITORING",
    painSite: "Abdomen / Epigastric",
    painSiteHi: "पेट / उदर (Abdominal)",
    vitals: { hr: 104, bp: "148/92", spo2: 96, resp: 22, temp: "99.4°F" },
    history: [1.2, 1.5, 2.0, 3.4, 4.8, 6.2, 7.8],
    medications: [
      { time: "06:00", drug: "IV Paracetamol 1000mg", route: "Infusion", status: "Administered" },
      { time: "09:30", drug: "IV Tramadol 50mg", route: "Slow Bolus", status: "Administered" },
      { time: "Pending", drug: "IV Fentanyl 50mcg", route: "SOS Rescue", status: "Pending Clinical Review" }
    ],
    incidents: [
      { time: "10:14:20", score: "7.8/10", site: "Abdomen", trigger: "Involuntary Brow Furrow & Grimace", response: "4.2s (RN Ack)" },
      { time: "07:45:11", score: "6.5/10", site: "Abdomen", trigger: "AU6 Eye Clench + Spasm", response: "5.8s (RN Ack)" }
    ]
  },
  {
    bed: "101",
    isLiveFeed: false,
    name: "Sunita Sharma",
    nameHi: "सुनीता शर्मा",
    age: 62,
    gender: "Female",
    admissionId: "IPD-2026-8892",
    admissionDate: "2026-09-14 14:20",
    ward: "Coronary Care Unit (CCU)",
    doctor: "Dr. Priya Deshmukh (DM, Cardiology)",
    diagnosis: "Acute Anterior Wall Myocardial Infarction (Post-Primary PTCA)",
    diagnosisHi: "हार्ट अटैक / एंजियोप्लास्टी के बाद गंभीर छाती का दर्द",
    nonVerbalReason: "Severe Dyspnea & BiPAP Mask Interface",
    nonVerbalReasonHi: "बाईपैप मास्क लगा होने से बोलने में असमर्थ",
    painScore: 6.9,
    severity: "severe",
    status: "ALERT_DISPATCHED",
    painSite: "Chest / Thorax (Cardiac)",
    painSiteHi: "छाती / हृदय (Cardiac)",
    vitals: { hr: 112, bp: "155/96", spo2: 94, resp: 24, temp: "98.6°F" },
    history: [2.1, 2.4, 3.1, 5.0, 6.2, 6.9, 6.8],
    medications: [
      { time: "08:00", drug: "Sublingual Nitroglycerin 0.4mg", route: "SL", status: "Administered" },
      { time: "08:30", drug: "IV Morphine Sulfate 2.5mg", route: "IV Push", status: "Administered" }
    ],
    incidents: [
      { time: "08:22:05", score: "6.9/10", site: "Chest", trigger: "Substernal Clench & AU4 Brow Lowering", response: "3.9s (RN Ack)" }
    ]
  },
  {
    bed: "102",
    isLiveFeed: false,
    name: "Mohammed Irfan",
    nameHi: "मोहम्मद इरफान",
    age: 41,
    gender: "Male",
    admissionId: "IPD-2026-9110",
    admissionDate: "2026-09-16 02:15",
    ward: "Trauma Intensive Care Unit (TICU)",
    doctor: "Dr. K. S. Rathore (MCh, Neuro-Trauma)",
    diagnosis: "Polytrauma, Flail Chest with Multiple Rib Fractures & Pneumothorax",
    diagnosisHi: "पसली फ्रैक्चर एवं छाती में गंभीर चोट (पॉलीट्रॉमा)",
    nonVerbalReason: "Chest Tube Insertion & Severe Agonal Respiratory Strain",
    nonVerbalReasonHi: "चेस्ट ट्यूब एवं सांस लेने में अत्यधिक कष्ट",
    painScore: 8.4,
    severity: "critical",
    status: "CRITICAL_DISTRESS",
    painSite: "Chest / Ribs",
    painSiteHi: "छाती एवं पसलियां",
    vitals: { hr: 126, bp: "162/100", spo2: 92, resp: 28, temp: "100.1°F" },
    history: [4.0, 5.2, 6.8, 7.5, 8.1, 8.4, 8.5],
    medications: [
      { time: "04:00", drug: "Epidural Bupivacaine Infusion 0.1%", route: "Epidural", status: "Active Infusion" },
      { time: "09:00", drug: "IV Ketorolac 30mg", route: "IV Push", status: "Administered" }
    ],
    incidents: [
      { time: "09:05:40", score: "8.4/10", site: "Rib Cage", trigger: "Violent Grimace with Thoracic Guarding", response: "2.8s (RN Ack)" }
    ]
  },
  {
    bed: "103",
    isLiveFeed: false,
    name: "Ananya Patel",
    nameHi: "अनन्या पटेल",
    age: 29,
    gender: "Female",
    admissionId: "IPD-2026-9204",
    admissionDate: "2026-09-16 19:40",
    ward: "High Dependency Obstetric Unit (HDU)",
    doctor: "Dr. Shalini Saxena (MD, Obstetrics)",
    diagnosis: "Emergency Cesarean Section (Post-Op Day 1) with Uterine Atony",
    diagnosisHi: "इमरजेंसी सिजेरियन ऑपरेशन (प्रसव उपरांत गंभीर दर्द)",
    nonVerbalReason: "Exhaustion & Severe Post-Dural Puncture Headache",
    nonVerbalReasonHi: "अत्यधिक कमजोरी एवं सिरदर्द के कारण बोलने में असमर्थ",
    painScore: 4.8,
    severity: "moderate",
    status: "MONITORING_STABLE",
    painSite: "Abdomen / Lower Pelvis",
    painSiteHi: "पेट के निचले हिस्से में टांकों का दर्द",
    vitals: { hr: 88, bp: "122/78", spo2: 98, resp: 18, temp: "98.8°F" },
    history: [7.2, 6.5, 5.8, 5.2, 4.8, 4.6, 4.8],
    medications: [
      { time: "07:00", drug: "IV Paracetamol 1g", route: "Infusion", status: "Administered" },
      { time: "08:00", drug: "Oxytocin Infusion 20 units", route: "IV", status: "Completed" }
    ],
    incidents: [
      { time: "01:20:15", score: "7.2/10", site: "Incision Site", trigger: "Wound Spasm on Movement", response: "6.1s (RN Ack)" }
    ]
  },
  {
    bed: "105",
    isLiveFeed: false,
    name: "Gurpreet Singh",
    nameHi: "गुरप्रीत सिंह",
    age: 68,
    gender: "Male",
    admissionId: "IPD-2026-8712",
    admissionDate: "2026-09-13 11:10",
    ward: "Neuro-Critical Care Unit (NCCU)",
    doctor: "Dr. Ramanathan Iyer (DM, Neurology)",
    diagnosis: "Left Middle Cerebral Artery (MCA) Ischemic Stroke with Right Hemiplegia",
    diagnosisHi: "लकवा एवं ब्रेन स्ट्रोक (बोलने की क्षमता पूर्णतः समाप्त)",
    nonVerbalReason: "Global Motor Aphasia & Facial Palsy (Completely Non-Verbal)",
    nonVerbalReasonHi: "मोटर एफेजिया (बिल्कुल बोल नहीं सकते)",
    painScore: 7.2,
    severity: "severe",
    status: "ALERT_DISPATCHED",
    painSite: "Right Upper Extremity (Hemiplegic Shoulder)",
    painSiteHi: "दाहिने कंधे और हाथ में तेज खिंचाव",
    vitals: { hr: 98, bp: "152/94", spo2: 97, resp: 20, temp: "98.4°F" },
    history: [2.5, 3.2, 4.5, 5.8, 6.7, 7.2, 7.1],
    medications: [
      { time: "06:00", drug: "Oral Pregabalin 75mg via NG Tube", route: "NG Tube", status: "Administered" },
      { time: "09:00", drug: "IV Mannitol 100ml 20%", route: "Infusion", status: "Administered" }
    ],
    incidents: [
      { time: "09:40:12", score: "7.2/10", site: "Right Arm", trigger: "Unilateral Grimace & Sustained Brow Furrow", response: "4.5s (RN Ack)" }
    ]
  },
  {
    bed: "106",
    isLiveFeed: false,
    name: "Meena Bai",
    nameHi: "मीना बाई",
    age: 47,
    gender: "Female",
    admissionId: "IPD-2026-8960",
    admissionDate: "2026-09-15 16:00",
    ward: "Orthopedic Surgical Care",
    doctor: "Dr. Sanjay Agrawal (MS, Orthopedics)",
    diagnosis: "Posterior Lumbar Interbody Fusion (L4-L5 Spinal Stabilization)",
    diagnosisHi: "रीढ़ की हड्डी का ऑपरेशन (L4-L5 स्पाइनल फ्यूजन)",
    nonVerbalReason: "Prone Position & Face Mask Sedation",
    nonVerbalReasonHi: "उल्टे लेटे होने एवं दर्द के कारण बोलने में असमर्थ",
    painScore: 5.5,
    severity: "moderate",
    status: "OBSERVATION",
    painSite: "Spine / Lumbar Back",
    painSiteHi: "रीढ़ / कमर (Lumbar Spine)",
    vitals: { hr: 84, bp: "130/84", spo2: 99, resp: 17, temp: "98.6°F" },
    history: [8.0, 7.1, 6.2, 5.8, 5.5, 5.4, 5.5],
    medications: [
      { time: "08:00", drug: "IV Diclofenac 75mg", route: "Infusion", status: "Administered" },
      { time: "08:00", drug: "IV Pantoprazole 40mg", route: "IV", status: "Administered" }
    ],
    incidents: [
      { time: "03:15:30", score: "8.0/10", site: "Lumbar Spine", trigger: "Spasmodic Grimace upon Log-Roll", response: "5.1s (RN Ack)" }
    ]
  },
  {
    bed: "107",
    isLiveFeed: false,
    name: "David Fernandez",
    nameHi: "डेविड फर्नांडीस",
    age: 35,
    gender: "Male",
    admissionId: "IPD-2026-9301",
    admissionDate: "2026-09-16 23:45",
    ward: "Burn & Critical Care Intensive Ward",
    doctor: "Dr. Farooq Qureshi (MCh, Plastic & Burn Surgery)",
    diagnosis: "Second-Degree Thermal Burns (35% TBSA) with Inhalation Injury",
    diagnosisHi: "अग्नि दुर्घटना में 35% झुलसने एवं सांस की नली में जलन का दर्द",
    nonVerbalReason: "Laryngeal Edema & Heavy Analgesic Drip",
    nonVerbalReasonHi: "गले में सूजन एवं तेज दर्द निवारक दवाइयों पर",
    painScore: 9.1,
    severity: "critical",
    status: "CRITICAL_DISTRESS",
    painSite: "Upper Torso & Bilateral Arms",
    painSiteHi: "ऊपरी छाती एवं दोनों हाथ",
    vitals: { hr: 132, bp: "105/65", spo2: 93, resp: 30, temp: "101.2°F" },
    history: [7.8, 8.2, 8.6, 8.9, 9.2, 9.1, 9.3],
    medications: [
      { time: "Continuous", drug: "IV Morphine Infusion (2mg/hr)", route: "Infusion Pump", status: "Active" },
      { time: "09:15", drug: "IV Midazolam 2mg", route: "IV Push", status: "Administered" }
    ],
    incidents: [
      { time: "09:12:00", score: "9.3/10", site: "Torso / Limbs", trigger: "Full-FACS Facial Spasm & Eye Squeeze", response: "2.1s (RN Ack)" }
    ]
  },
  {
    bed: "108",
    isLiveFeed: false,
    name: "Master Aarav Sharma",
    nameHi: "मास्टर आरव शर्मा",
    age: 8,
    gender: "Male",
    admissionId: "IPD-2026-9412",
    admissionDate: "2026-09-17 06:15",
    ward: "Pediatric Intensive Care Unit (PICU)",
    doctor: "Dr. Neha Singhal (MD, Pediatrics & Intensive Care)",
    diagnosis: "Post-Laparoscopic Appendectomy (Pediatric Acute Abdomen with Peritonitis)",
    diagnosisHi: "बच्चों की अपेंडिक्स सर्जरी (पेरिटोनाइटिस के उपरांत पेट में तेज दर्द)",
    nonVerbalReason: "Pediatric Fear-Induced Non-Verbal State & Involuntary Guarding",
    nonVerbalReasonHi: "भय एवं तीव्र दर्द के कारण बोलने में असमर्थ (बाल चिकित्सा)",
    painScore: 7.4,
    severity: "severe",
    status: "ALERT_DISPATCHED",
    painSite: "Right Lower Quadrant / Abdomen",
    painSiteHi: "पेट का निचला दाहिना हिस्सा (Abdomen)",
    vitals: { hr: 118, bp: "102/64", spo2: 98, resp: 26, temp: "100.4°F" },
    history: [3.0, 3.8, 5.1, 6.2, 7.0, 7.4, 7.2],
    medications: [
      { time: "06:30", drug: "IV Paracetamol 150mg", route: "Infusion", status: "Administered" },
      { time: "09:00", drug: "IV Ondansetron 2mg", route: "Slow Push", status: "Administered" },
      { time: "Pending", drug: "IV Fentanyl 10mcg", route: "SOS Pediatric Rescue", status: "Pending Senior Review" }
    ],
    incidents: [
      { time: "08:50:22", score: "7.4/10", site: "RLQ Abdomen", trigger: "Pediatric FLACC Facial Grimace & Leg Kicking", response: "3.2s (RN Ack)" }
    ]
  },
  {
    bed: "109",
    isLiveFeed: false,
    name: "Kamla Devi",
    nameHi: "कमला देवी",
    age: 76,
    gender: "Female",
    admissionId: "IPD-2026-9488",
    admissionDate: "2026-09-17 11:30",
    ward: "Geriatric Palliative & Critical Care",
    doctor: "Dr. Sanjeev Kapoor (MD, Palliative Oncology)",
    diagnosis: "Advanced Pancreatic Neoplasm with Intractable Visceral Pain Crisis",
    diagnosisHi: "अग्न्याशय (Pancreas) ट्यूमर से उत्पन्न असहनीय आंतरिक दर्द",
    nonVerbalReason: "Post-Operative Delirium, Cognitive Decline & Extreme Frailty",
    nonVerbalReasonHi: "भ्रम (Delirium) एवं अत्यधिक कमजोरी के कारण निशब्द",
    painScore: 8.7,
    severity: "critical",
    status: "CRITICAL_DISTRESS",
    painSite: "Epigastric / Radiating to Spine",
    painSiteHi: "पेट के ऊपरी हिस्से से पीठ तक फैलता दर्द",
    vitals: { hr: 110, bp: "168/98", spo2: 93, resp: 24, temp: "99.1°F" },
    history: [5.5, 6.2, 7.1, 8.0, 8.4, 8.7, 8.6],
    medications: [
      { time: "Continuous", drug: "IV Fentanyl PCA (25mcg/hr)", route: "PCA Pump", status: "Active" },
      { time: "08:15", drug: "IV Haloperidol 0.5mg", route: "Slow Push", status: "Administered" }
    ],
    incidents: [
      { time: "09:02:14", score: "8.7/10", site: "Epigastric", trigger: "Continuous AU4 Corrugator Spasm & Deep Eye Clench", response: "2.4s (RN Ack)" }
    ]
  },
  {
    bed: "110",
    isLiveFeed: false,
    name: "Vikramaditya Rao",
    nameHi: "विक्रमादित्य राव",
    age: 44,
    gender: "Male",
    admissionId: "IPD-2026-9520",
    admissionDate: "2026-09-18 04:00",
    ward: "Solid Organ Transplant ICU (OT-ICU)",
    doctor: "Dr. Harish Chandra (MS, MCh, Renal Transplant)",
    diagnosis: "Post-Renal Allograft (Live Donor Kidney Transplant Day 2)",
    diagnosisHi: "किडनी प्रत्यारोपण के बाद गंभीर सर्जिकल ग्राफ्ट दर्द",
    nonVerbalReason: "Endotracheal Weaning Protocol & High Immunosuppressive Sedation",
    nonVerbalReasonHi: "वेन्टिलेटर वीनिंग एवं दवाओं के प्रभाव से बोलने में असमर्थ",
    painScore: 6.4,
    severity: "severe",
    status: "ALERT_DISPATCHED",
    painSite: "Right Iliac Fossa (Allograft Bed)",
    painSiteHi: "दाहिनी ओर किडनी प्रत्यारोपण का स्थान",
    vitals: { hr: 94, bp: "142/88", spo2: 97, resp: 19, temp: "98.9°F" },
    history: [3.2, 4.0, 4.8, 5.5, 6.0, 6.4, 6.3],
    medications: [
      { time: "Continuous", drug: "IV Tacrolimus Infusion", route: "CVC", status: "Active" },
      { time: "07:30", drug: "IV Buprenorphine 0.3mg", route: "IV Push", status: "Administered" },
      { time: "08:00", drug: "IV Methylprednisolone 500mg", route: "Infusion", status: "Completed" }
    ],
    incidents: [
      { time: "08:34:50", score: "6.4/10", site: "Graft Site", trigger: "Unilateral Grimace & Muscle Splinting", response: "3.8s (RN Ack)" }
    ]
  }
];

window.PATIENT_WARD_DATABASE = PATIENT_WARD_DATABASE;
