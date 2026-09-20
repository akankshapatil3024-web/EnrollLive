import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Pill, 
  DollarSign, 
  Calendar, 
  UserCheck,
  FileText,
  Sliders,
  Languages,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Edit3,
} from 'lucide-react';
import { AiExplanationResult, ExplanationLanguage, PatientRecord } from '../types';
import { WhatIfSimulator } from './WhatIfSimulator';
import { PatientInterventionsTab } from './PatientInterventionsTab';

interface PatientDetailModalProps {
  patient: PatientRecord | null;
  onClose: () => void;
  autoRequestAi?: boolean;
  initialTab?: 'profile' | 'simulator' | 'interventions';
  onOpenReport?: (patient: PatientRecord, aiExplanation?: AiExplanationResult | null) => void;
  onEditPatient?: (patient: PatientRecord) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  autoRequestAi = false,
  initialTab = 'profile',
  onOpenReport,
  onEditPatient,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<ExplanationLanguage>('en');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiExplanationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showExtendedDetails, setShowExtendedDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'simulator' | 'interventions'>(initialTab);

  // Synchronize activeTab if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Trigger AI if autoRequestAi is true or language changed
  React.useEffect(() => {
    if (patient && autoRequestAi && !aiResult && !aiLoading) {
      handleRequestAi(selectedLanguage);
    }
  }, [patient, autoRequestAi]);

  if (!patient) return null;

  const handleLanguageChange = (lang: ExplanationLanguage) => {
    setSelectedLanguage(lang);
    // Request translated explanation for this patient without altering risk logic
    handleRequestAi(lang);
  };

  const handleRequestAi = async (lang: ExplanationLanguage = selectedLanguage) => {
    if (!patient) return;
    setAiLoading(true);
    setAiError(null);

    try {
      // Sending ONLY this single patient's relevant clinical fields
      const payload = {
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        medicalCondition: patient.medicalCondition,
        admissionType: patient.admissionType,
        testResults: patient.testResults,
        medication: patient.medication,
        lengthOfStayDays: patient.lengthOfStayDays,
        riskScore: patient.riskScore,
        riskLevel: patient.riskLevel,
        contributingFactors: patient.contributingFactors.map(f => `${f.factor} (+${f.points} pts)`),
        language: lang,
      };

      const response = await fetch('/api/gemini/explain-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.fallback) {
          setAiResult(data.fallback);
        } else {
          throw new Error(data.error || 'Server error generating explanation');
        }
      } else {
        setAiResult(data.analysis);
      }
    } catch (err: any) {
      console.error('AI explanation request failed:', err);
      setAiError(err.message || 'Unable to connect to AI explanation service');
      
      // Multilingual fallback summaries matching the user wireframe
      const fallbackSummary = 
        lang === 'hi'
          ? `इस मरीज का जोखिम सूचक बढ़ा हुआ है क्योंकि कई ज्ञात जोखिम कारक उपस्थित हैं, जिनमें ${patient.admissionType === 'Emergency' ? 'आपातकालीन' : 'तत्काल'} भर्ती, ${patient.testResults === 'Abnormal' ? 'असामान्य' : 'जांच'} परिणाम और ${patient.medicalCondition} की दीर्घकालिक देखभाल शामिल है।`
          : lang === 'mr'
          ? `या रुग्णाचा जोखीम निर्देशांक वाढलेला आहे कारण अनेक जोखीम घटक उपस्थित आहेत, ज्यामध्ये ${patient.admissionType === 'Emergency' ? 'तातडीची (इमर्जन्सी)' : 'दाखल'} प्रक्रिया, ${patient.testResults === 'Abnormal' ? 'असामान्य' : 'तपासणी'} अहवाल आणि ${patient.medicalCondition} चे दीर्घकालीन व्यवस्थापन आवश्यक आहे.`
          : `This patient's risk indicator is elevated because several available risk factors are present, including ${patient.admissionType.toLowerCase()} admission presentation, ${patient.testResults.toLowerCase()} discharge lab indicators, and chronic ${patient.medicalCondition.toLowerCase()} management requiring structured follow-up.`;

      setAiResult({
        summary: fallbackSummary,
        clinicalDrivers: patient.contributingFactors.slice(0, 3).map(f => `${f.factor}: ${f.description}`),
        monitoringSuggestions: lang === 'hi' ? [
          'सघन निगरानी पर विचार करें',
          'डिस्चार्ज और अनुवर्ती आवश्यकताओं की समीक्षा करें',
          'उचित समय पर फॉलो-अप अपॉइंटमेंट तय करें'
        ] : lang === 'mr' ? [
          'अधिक काळजीपूर्वक देखरेख ठेवा',
          'डिस्चार्ज आणि पाठपुरावा गरजा तपासा',
          'योग्य पाठपुरावा (फॉलो-अप) निश्चित करा'
        ] : [
          'Consider closer monitoring',
          'Review discharge/follow-up requirements',
          'Schedule appropriate follow-up'
        ],
        redFlagSymptoms: [
          'Acute exacerbation of primary chronic illness symptoms',
          'Difficulty breathing or sudden chest discomfort'
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const isHigh = patient.riskLevel === 'High';
  const isMedium = patient.riskLevel === 'Medium';

  // Contributing factors with accurate status dots and explanation of score impact
  const getContributingFactorItems = () => {
    const items: { dot: 'red' | 'orange' | 'green'; text: string; rationale: string }[] = [];

    // 1. Admission Type
    if (patient.admissionType.toLowerCase() === 'emergency') {
      items.push({ 
        dot: 'red', 
        text: 'Emergency admission', 
        rationale: 'Unplanned acute emergency presentation increases screening score.' 
      });
    } else if (patient.admissionType.toLowerCase() === 'urgent') {
      items.push({ 
        dot: 'orange', 
        text: 'Urgent admission', 
        rationale: 'Semi-acute unscheduled admission increases screening score.' 
      });
    } else {
      items.push({ 
        dot: 'green', 
        text: 'Elective admission', 
        rationale: 'Planned admission with pre-operative preparation decreases screening score.' 
      });
    }

    // 2. Test Result
    if (patient.testResults.toLowerCase() === 'abnormal') {
      items.push({ 
        dot: 'red', 
        text: 'Abnormal test result', 
        rationale: 'Out-of-range clinical biomarkers increase screening score.' 
      });
    } else if (patient.testResults.toLowerCase() === 'inconclusive') {
      items.push({ 
        dot: 'orange', 
        text: 'Inconclusive test result', 
        rationale: 'Uncertain diagnostic parameters moderately increase screening score.' 
      });
    } else {
      items.push({ 
        dot: 'green', 
        text: 'Normal test result', 
        rationale: 'Physiological parameters within reference range decrease screening score.' 
      });
    }

    // 3. Chronic Condition
    items.push({ 
      dot: 'orange', 
      text: `Chronic condition (${patient.medicalCondition})`, 
      rationale: 'Documented comorbidity increases vulnerability during care transition.' 
    });

    // 4. Age
    if (patient.age >= 65) {
      items.push({ 
        dot: 'orange', 
        text: `Older age (${patient.age} yrs)`, 
        rationale: 'Senior age bracket (65+) increases screening score due to reduced functional reserve.' 
      });
    } else if (patient.age >= 50) {
      items.push({ 
        dot: 'orange', 
        text: `Older adult age (${patient.age} yrs)`, 
        rationale: 'Age 50-64 slightly increases baseline chronic disease vulnerability.' 
      });
    } else {
      items.push({ 
        dot: 'green', 
        text: `Standard age bracket (${patient.age} yrs)`, 
        rationale: 'Lower baseline physiological vulnerability decreases screening score.' 
      });
    }

    return items;
  };

  // Default AI explanation matching wireframe phrasing
  const defaultExplanation = 
    selectedLanguage === 'hi'
      ? "इस मरीज का जोखिम सूचक बढ़ा हुआ है क्योंकि कई उपलब्ध जोखिम कारक उपस्थित हैं, जिनमें आपातकालीन भर्ती प्रस्तुति, असामान्य डिस्चार्ज नैदानिक संकेतक और पुरानी स्थिति प्रबंधन शामिल हैं।"
      : selectedLanguage === 'mr'
      ? "या रुग्णाचा जोखीम निर्देशांक वाढलेला आहे कारण अनेक उपलब्ध जोखीम घटक उपस्थित आहेत, ज्यामध्ये तातडीची दाखल स्थिती, असामान्य डिस्चार्ज वैद्यकीय चाचण्या आणि दीर्घकालीन आजार व्यवस्थापन समाविष्ट आहे."
      : isHigh
      ? "This patient's risk indicator is elevated because several available risk factors are present, including emergency admission presentation, abnormal discharge diagnostic indicators, and chronic condition management."
      : isMedium
      ? "This patient's risk indicator is moderately elevated due to chronic condition management and inpatient admission acuity, warranting structured outpatient follow-up."
      : "This patient's risk indicator is low, reflecting elective admission acuity and normal baseline discharge findings with standard post-discharge care protocols.";

  const activeExplanation = aiResult?.summary || defaultExplanation;

  // Follow-up suggestions matching wireframe
  const followUpSuggestions = 
    selectedLanguage === 'hi'
      ? ['सघन निगरानी पर विचार करें', 'डिस्चार्ज और फॉलो-अप आवश्यकताओं की समीक्षा करें', 'उचित फॉलो-अप निर्धारित करें']
      : selectedLanguage === 'mr'
      ? ['अधिक काळजीपूर्वक देखरेख ठेवा', 'डिस्चार्ज आणि पाठपुरावा गरजांची पडताळणी करा', 'योग्य पाठपुरावा नियोजित करा']
      : [
        'Consider closer monitoring',
        'Review discharge/follow-up requirements',
        'Schedule appropriate follow-up'
      ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden" 
      id="patient-detail-modal"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[min(92vh,700px)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header (Fixed at top) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800">
              Patient Screening Profile
            </span>
            <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {patient.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEditPatient && (
              <button
                type="button"
                onClick={() => onEditPatient(patient)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs"
                title="Edit Patient Details & Clinical Reports"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Edit Details &amp; Report</span>
              </button>
            )}

            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(patient, aiResult)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                title="Generate One-Click Risk Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Generate Report</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              id="close-patient-modal-btn"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs: Clinical Profile vs What-If Simulator (Fixed) */}
        <div className="px-5 pt-2 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile &amp; AI Explanation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'simulator'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>🔮 What-If Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interventions')}
            className={`pb-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'interventions'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Care Plan</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0 text-slate-900 table-scrollbar">
          
          {activeTab === 'interventions' ? (
            <PatientInterventionsTab patient={patient} />
          ) : activeTab === 'simulator' ? (
            <WhatIfSimulator 
              patient={patient}
              onOpenReport={(sim) => onOpenReport && onOpenReport(sim, aiResult)}
            />
          ) : (
            <>
              {/* ──────────────────── READMISSION ALERT & ENCOUNTER DATA ──────────────────── */}
              {patient.readmissionTarget === 1 && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 space-y-2" id="patient-readmission-alert">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <span>🚨 30-Day Hospital Readmission Recorded</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 uppercase">
                      {patient.readmissionAcuity || 'Emergency'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block uppercase font-semibold">Readmission Date</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{patient.readmissionDate || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block uppercase font-semibold">Post-Discharge Interval</span>
                      <strong className="text-purple-800 dark:text-purple-300 font-mono">{patient.readmissionDays || 14} days post-discharge</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block uppercase font-semibold">Original Discharge</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{patient.dischargeDate || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="text-xs pt-1 border-t border-purple-200/60 dark:border-purple-800">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 block uppercase font-semibold">Clinical Cause / Relapse Diagnosis</span>
                    <p className="text-purple-950 dark:text-purple-200 font-medium mt-0.5">{patient.readmissionReason || 'Acute post-discharge decompensation'}</p>
                  </div>
                </div>
              )}

              {/* ──────────────────── SECTION 1: PATIENT PROFILE ──────────────────── */}
              <div id="section-patient-profile">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  PATIENT PROFILE
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs sm:text-sm">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Patient ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{patient.id}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Age:</span>
                    <span className="font-bold text-slate-900">{patient.age}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Gender:</span>
                    <span className="font-bold text-slate-900">{patient.gender}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Medical Condition:</span>
                    <span className="font-bold text-slate-900">{patient.medicalCondition}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Admission Type:</span>
                    <span className="font-bold text-slate-900">{patient.admissionType}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5 border-b border-slate-100 sm:border-0">
                    <span className="text-slate-500 font-medium">Test Result:</span>
                    <span className={`font-bold ${
                      patient.testResults.toLowerCase() === 'abnormal'
                        ? 'text-rose-600'
                        : patient.testResults.toLowerCase() === 'inconclusive'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {patient.testResults}
                    </span>
                  </div>
                </div>
              </div>

              {/* ──────────────────── DIVIDER ──────────────────── */}
              <hr className="border-t border-slate-200" />

              {/* ──────────────────── SECTION 2: RISK SCREENING SCORE ──────────────────── */}
              <div className="text-center py-2" id="section-readmission-risk">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  RISK SCREENING SCORE
                </h2>

                <div className="mt-1">
                  <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono ${
                    isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {patient.riskScore} / 100
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      isHigh 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : isMedium 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isHigh ? 'High Screening Risk' : isMedium ? 'Medium Screening Risk' : 'Low Screening Risk'}
                    </span>
                  </div>

                  {/* Mandatory Prototype Disclaimer near score */}
                  <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto leading-normal">
                    Prototype decision-support score based on available patient data. Not a clinical diagnosis.
                  </p>
                </div>
              </div>

              {/* ──────────────────── DIVIDER ──────────────────── */}
              <hr className="border-t border-slate-200" />

              {/* ──────────────────── SECTION 3: CONTRIBUTING FACTORS ──────────────────── */}
              <div id="section-contributing-factors">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  CONTRIBUTING FACTORS
                </h2>

                <ul className="space-y-2 text-xs sm:text-sm">
                  {getContributingFactorItems().map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-base select-none mt-0.5">
                        {factor.dot === 'red' ? '🔴' : factor.dot === 'orange' ? '🟠' : '🟢'}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{factor.text}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{factor.rationale}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ──────────────────── DIVIDER ──────────────────── */}
              <hr className="border-t border-slate-200" />

              {/* ──────────────────── SECTION 4: 🧠 Why This Patient? ──────────────────── */}
              <div id="section-ai-explanation">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>🧠 Why This Patient?</span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      AI explanation based on available patient data.
                    </p>
                  </div>

                  {/* Language selector buttons: English | हिंदी | मराठी */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="ai-language-selector">
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('en')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          selectedLanguage === 'en'
                            ? 'bg-white text-sky-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('hi')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          selectedLanguage === 'hi'
                            ? 'bg-white text-sky-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('mr')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          selectedLanguage === 'mr'
                            ? 'bg-white text-sky-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        मराठी
                      </button>
                    </div>

                    <button
                      onClick={() => handleRequestAi(selectedLanguage)}
                      disabled={aiLoading}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 disabled:opacity-50"
                      title="Synthesize risk explanation with Gemini 3.8 Flash"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>{aiLoading ? 'Synthesizing...' : aiResult ? 'Regenerate' : 'Consult Gemini'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                  &ldquo;{activeExplanation}&rdquo;
                </div>

                {aiResult?.clinicalDrivers && aiResult.clinicalDrivers.length > 0 && (
                  <div className="mt-2.5 pl-3 border-l-2 border-sky-300 text-xs text-slate-600 space-y-1">
                    {aiResult.clinicalDrivers.map((driver, i) => (
                      <p key={i}>• {driver}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* ──────────────────── DIVIDER ──────────────────── */}
              <hr className="border-t border-slate-200" />

              {/* ──────────────────── SECTION 5: RECOMMENDED CLINICAL FOLLOW-UP ──────────────────── */}
              <div id="section-follow-up">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  RECOMMENDED CLINICAL FOLLOW-UP
                </h2>

                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-800 font-medium">
                  {followUpSuggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-500 font-bold select-none">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ──────────────────── FOOTER DISCLAIMER ──────────────────── */}
              <div className="pt-1 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                <span>⚠️</span>
                <span>Decision-support prototype only</span>
              </div>

              {/* ──────────────────── OPTIONAL EXTENDED DETAILS ACCORDION ──────────────────── */}
              <div className="border-t border-slate-200 pt-3">
                <button
                  onClick={() => setShowExtendedDetails(!showExtendedDetails)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1 transition-colors"
                >
                  <span>View Full Hospital Stay &amp; Administrative Records</span>
                  {showExtendedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showExtendedDetails && (
                  <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Full Name</span>
                      <span className="font-semibold text-slate-900">{patient.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Attending Physician</span>
                      <span className="font-semibold text-slate-900">{patient.doctor}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Facility / Hospital</span>
                      <span className="font-semibold text-slate-900">{patient.hospital}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Room &amp; Blood Type</span>
                      <span className="font-mono text-slate-900">Room #{patient.roomNumber} • {patient.bloodType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Prescribed Medication</span>
                      <span className="font-semibold text-slate-900">{patient.medication}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Admission / Discharge</span>
                      <span className="font-mono text-slate-900">{patient.dateOfAdmission} to {patient.dischargeDate || 'Active'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Length of Stay</span>
                      <span className="font-bold text-sky-700">{patient.lengthOfStayDays} days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Billing &amp; Insurance</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${patient.billingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({patient.insuranceProvider})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Modal Footer (Fixed at bottom) */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono truncate max-w-[200px] sm:max-w-none">Patient: {patient.id} • {patient.name}</span>
          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(patient, aiResult)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

