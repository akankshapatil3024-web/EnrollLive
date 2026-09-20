import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "EnrollLive" });
});

// Explain Risk ("Why This Patient?") endpoint for a single patient record
// Note: ONLY the single patient's relevant fields are received and sent to Gemini.
// Never sends the full dataset or CSV.
app.post("/api/gemini/explain-risk", async (req, res) => {
  try {
    const {
      patientId,
      name,
      age,
      gender,
      medicalCondition,
      admissionType,
      testResults,
      medication,
      lengthOfStayDays,
      riskScore,
      riskLevel,
      contributingFactors,
      language = "en", // 'en' | 'hi' | 'mr'
    } = req.body;

    if (!medicalCondition || riskScore === undefined) {
      return res.status(400).json({ error: "Missing required patient risk information" });
    }

    const ai = getGeminiClient();

    const languageInstruction = 
      language === "hi"
        ? "Respond strictly in Hindi (हिंदी). Use clear, respectful, and natural Hindi medical terminology suitable for clinical staff and patient advocates."
        : language === "mr"
        ? "Respond strictly in Marathi (मराठी). Use clear, respectful, and natural Marathi medical terminology suitable for clinical staff and patient advocates."
        : "Respond strictly in English. Provide clear, objective, and plain-language clinical decision-support explanations.";

    const prompt = `You are a clinical decision-support AI assistant integrated into "EnrollLive - AI-Powered Hospital Readmission Risk Screening", a prototype application for educational and demonstration purposes.

Provide an objective, transparent, and easy-to-understand explanation for WHY this single patient's risk screening score is ${riskScore} / 100 (${riskLevel} Screening Risk).

CRITICAL CONSTRAINTS:
1. Use ONLY the supplied data for this single patient. Do NOT invent or extrapolate missing medical details.
2. DO NOT diagnose the patient.
3. DO NOT claim certainty that the patient will definitely be readmitted.
4. AI explanation is based only on the available patient data.
5. Emphasize that this is a prototype screening score based on available demographic and hospital admission data, not a definitive clinical diagnosis.
6. Language Requirement: ${languageInstruction}

Selected Patient Data:
- Patient ID: ${patientId || "PID-Unknown"}
- Name: ${name || "Patient"}
- Age: ${age} years | Gender: ${gender || "Unspecified"}
- Primary Medical Condition: ${medicalCondition}
- Admission Type: ${admissionType}
- Test Result: ${testResults}
- Inpatient Stay: ${lengthOfStayDays} day(s)
- Current Medication: ${medication || "Standard therapeutic protocol"}
- Screening Score: ${riskScore} / 100 (${riskLevel} Screening Risk)
- Top Contributing Factors: ${Array.isArray(contributingFactors) ? contributingFactors.join("; ") : "Standard baseline"}

Provide your response in this exact JSON structure:
{
  "summary": "2-3 clear sentences in the requested language explaining why the screening score is at this level based strictly on available factors.",
  "clinicalDrivers": ["Factor 1 and observation", "Factor 2 and observation", "Factor 3 and observation"],
  "monitoringSuggestions": ["General follow-up suggestion 1", "General follow-up suggestion 2"],
  "redFlagSymptoms": ["Warning sign 1 for review", "Warning sign 2 for review"]
}

Respond ONLY with valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      parsedData = {
        summary: responseText,
        clinicalDrivers: contributingFactors || [],
        monitoringSuggestions: ["Ensure routine outpatient primary care follow-up", "Verify medication adherence before discharge"],
        redFlagSymptoms: ["Acute exacerbation of chronic symptoms", "Vital sign instability"],
      };
    }

    res.json({
      success: true,
      analysis: parsedData,
      disclaimer: "EnrollLive is a prototype decision-support system for educational and demonstration purposes. It does not replace qualified healthcare professionals or clinical judgment. Prototype decision-support score based on available patient data. Not a clinical diagnosis.",
    });
  } catch (error: any) {
    console.error("Gemini explain risk error:", error);

    const lang = req.body?.language || "en";
    const condition = req.body?.medicalCondition || "chronic condition";
    const admType = req.body?.admissionType || "admission";
    const score = req.body?.riskScore ?? 78;
    const level = req.body?.riskLevel || "High";

    let localizedSummary = "";
    if (lang === "hi") {
      localizedSummary = `उपलब्ध रोगी डेटा के आधार पर ${condition} और ${admType} जैसे जोखिम कारकों के कारण स्क्रीनिंग स्कोर ${score}/100 (${level} स्क्रीनिंग जोखिम) है। यह केवल प्रोटोटाइप निर्णय-समर्थन है।`;
    } else if (lang === "mr") {
      localizedSummary = `उपलब्ध रुग्णाच्या डेटामध्ये ${condition} आणि ${admType} यांसारखे जोखीम घटक असल्यामुळे स्क्रीनिंग स्कोअर ${score}/100 (${level} स्क्रीनिंग जोखीम) आहे. हा केवळ निर्णय-समर्थन प्रोटोटाइप आहे.`;
    } else {
      localizedSummary = `The risk screening score is ${score} / 100 (${level} Screening Risk) based on available patient parameters including ${condition}, ${admType} admission, and laboratory test status. This decision-support indicator is derived solely from recorded data.`;
    }

    res.status(200).json({
      success: true,
      isFallback: true,
      analysis: {
        summary: localizedSummary,
        clinicalDrivers: req.body?.contributingFactors?.length > 0
          ? req.body.contributingFactors
          : [
              `Primary condition (${condition}) management`,
              `Acuity of presentation (${admType})`,
              `Laboratory status (${req.body?.testResults || 'Reported'})`
            ],
        monitoringSuggestions: [
          "Verify standard discharge medications and treatment reconciliation.",
          "Ensure routine post-discharge primary care check-in as clinically indicated."
        ],
        redFlagSymptoms: [
          "Sudden worsening of baseline chronic symptoms.",
          "Unmanaged fever or acute vital sign instability."
        ]
      },
      disclaimer: "EnrollLive is a prototype decision-support system for educational and demonstration purposes. It does not replace qualified healthcare professionals or clinical judgment."
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EnrollLive server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
