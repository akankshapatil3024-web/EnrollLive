# 🏥 EnrollLive

## AI-Powered Hospital Readmission Risk Screening

EnrollLive is an AI-powered healthcare decision-support prototype designed to help healthcare professionals identify patients who may require closer review after hospital discharge.

It analyzes healthcare patient data and provides risk screening, contributing factors, explainable AI insights, early-warning identification, What-If simulation, multilingual explanations, and patient risk reports.

---

## 🎯 Problem Statement

Patients with chronic diseases may require repeated hospital visits after discharge. Hospitals often have large amounts of patient information but may not have an effective mechanism to identify patients who may require additional monitoring.

ReadmitAI aims to make patient information easier to analyze and provide data-driven decision support.

---

## 💡 Our Solution

EnrollLive provides a centralized platform where healthcare professionals can:

- Search and analyze patient records
- Identify high-risk patients
- Understand contributing risk factors
- Get AI-powered explanations
- Simulate What-If scenarios
- View early-warning patients
- Generate patient risk reports
- Get explanations in English, Hindi, and Marathi

---

## 🚀 Key Features

### 🧠 Explainable AI — "Why This Patient?"
Provides an AI-generated explanation of the major factors contributing to a patient's risk-screening score.

### 🔮 What-If Risk Simulator
Allows users to change supported patient factors and compare the current score with a simulated score.

### 🚨 Early Warning Center
Highlights patients with higher screening risk for priority review.

### 🌐 Multilingual AI
Provides explanations in:
- English
- Hindi
- Marathi

### 📄 Patient Risk Report
Generates a structured report containing patient information, screening score, contributing factors, AI explanation, and general monitoring suggestions.

### 📊 Healthcare Analytics
Provides visualizations for:
- Risk distribution
- Medical conditions
- Admission types
- Test results
- Age distribution

### 🔍 Patient Search & Filtering
Search and filter patients using available healthcare attributes.

### 📁 Large Dataset Support
Designed to handle approximately **55,502 patient records** using efficient data processing, search, filtering, and pagination.

---

## 🔄 System Workflow

```text
Healthcare Dataset
        ↓
CSV Import
        ↓
Data Processing
        ↓
Patient Database
        ↓
Search / Filter
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

📊 Dataset
The application is designed to work with the specified healthcare dataset containing approximately 55,502 patient records.
The complete dataset is handled by the application's data layer.
The complete dataset is not sent to Gemini.
55,502 Records
      ↓
Application Data Layer
      ↓
Search / Filter
      ↓
Selected Patient
      ↓
Gemini AI

🤖 AI Integration
Gemini is used primarily for patient-level explanations.
Patient Data
     ↓
Risk Screening
     ↓
Contributing Factors
     ↓
Gemini AI
     ↓
Simple AI Explanation
Only relevant selected-patient information is sent for an explanation rather than the entire dataset.

📈 Model Evaluation
If the supplied dataset contains a genuine readmission target, the system can evaluate a classification model using:
Accuracy
Precision
Recall
F1 Score
Confusion Matrix
ROC-AUC
If a genuine readmission target is not available, the application does not fabricate model metrics and presents the system as a:
Readmission Risk Screening Prototype

🖥️ Application Modules
Dashboard
│
├── Patient Statistics
├── Risk Distribution
├── Healthcare Analytics
│
├── Patients
│   ├── Search
│   ├── Filter
│   └── Patient Profile
│
├── Early Warning
│
├── Analytics
│
├── Model Evaluation
│
└── Patient Report

🔐 Security & Privacy
Do not commit API keys to GitHub.
Use environment variables for sensitive credentials.
Use anonymized or synthetic patient data for demonstrations whenever possible.
Avoid exposing personally identifiable healthcare information.

🔮 Future Scope
Hospital information system integration
Real-time patient monitoring
Clinically validated prediction models
Longitudinal patient history
Role-based authentication
Secure audit logs
Mobile application
Additional Indian regional languages
Real-time hospital alerts
