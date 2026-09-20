# 🏥 EnrollLive

**AI-Assisted Healthcare Patient Risk Screening & Analytics Platform**

EnrollLive is a healthcare analytics prototype designed to help identify patient risk, understand contributing factors, and generate AI-assisted explanations for selected patients.

---

## 📌 Overview

EnrollLive processes healthcare patient data and provides:

- Patient search and filtering
- Risk screening
- Contributing-factor analysis
- AI-generated explanations
- What-If simulation
- Early warning insights
- Patient risk reports
- Healthcare analytics

---

## 🎯 Problem Statement

Healthcare professionals may need to analyze large amounts of patient information to identify patients who may require attention. Understanding risk factors quickly can support better monitoring and early intervention.

---

## 💡 Proposed Solution

EnrollLive provides a centralized platform that processes patient data and presents risk-related insights through an easy-to-use interface.

**Key idea:**

`Patient Data → Risk Screening → Explanation → Early Warning → Report`

---

## 📊 Dataset

- Approximately **55,502 patient records**
- Dataset is imported through CSV
- Complete dataset is handled by the application's data layer
- The complete dataset is **not sent to Gemini**
- Only relevant information from the **selected patient** is sent for AI explanation

---

## 🔄 System Workflow

```text
Healthcare Dataset
       ↓
    CSV Import
       ↓
 Data Processing
       ↓
 Patient Data Layer
       ↓
 Search / Filter
       ↓
 Selected Patient
       ↓
  Risk Screening
       ↓
 Contributing Factors
       ↓
 Gemini AI Explanation
       ↓
 What-If Simulation
       ↓
   Early Warning
       ↓
 Patient Risk Report
```

---

## 🖥️ Application Modules

| Module | Function |
|---|---|
| 📊 Dashboard | Patient statistics and risk distribution |
| 👥 Patients | Search, filter, and patient profiles |
| ⚠️ Risk Screening | Identify patient risk levels |
| 🔍 Contributing Factors | Understand factors affecting risk |
| 🤖 AI Explanation | Gemini-based patient-level explanation |
| 🔄 What-If Simulation | Explore changes in risk factors |
| 🚨 Early Warning | Highlight patients requiring attention |
| 📄 Patient Report | Generate patient risk summary |
| 📈 Analytics | Healthcare data insights |
| 🧪 Model Evaluation | Evaluate prediction performance when valid labels are available |

---

## 🤖 AI Integration

EnrollLive uses **Google Gemini** to provide understandable explanations for selected patient risk.

The AI receives only the relevant selected-patient information rather than the complete dataset.

---

## 🛠️ Technology Stack

- React
- JavaScript / TypeScript
- CSV
- Google Gemini API
- Git & GitHub
- VS Code

---

## 🔐 Security & Privacy

- Never commit API keys to GitHub
- Use environment variables for sensitive credentials
- Use anonymized/synthetic data for demonstrations
- Avoid exposing personally identifiable healthcare information
- Send only minimum required patient information to AI

---

## 🚀 Future Scope

- Real-time patient monitoring
- Hospital system integration
- Clinically validated prediction models
- Role-based authentication
- Secure audit logs
- Mobile application
- Regional language support
- Real-time hospital alerts

---

## ⚠️ Disclaimer

EnrollLive is a **prototype for educational and research purposes**. It is not a replacement for doctors, clinical diagnosis, medical advice, or hospital decision-making protocols.

---

## 📌 Project Status

**Status:** Prototype / Development

**Project:** EnrollLive  
**Focus:** AI-Assisted Healthcare Risk Screening & Analytics
