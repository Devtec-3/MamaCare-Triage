import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

export interface TriageInput {
  patientName: string;
  patientAgeYears: number | null;
  patientWeightKg: number | null;
  patientSex: string | null;
  symptoms: string;
  photoBase64?: string | null;
  medications?: string | null;
  previousVisitCount?: number;
}

export interface TriageResult {
  urgency: "routine" | "needs_monitoring" | "urgent_referral";
  conditions: string;
  recommendation: string;
  dosage: string | null;
  dangerSignDetected: boolean;
  referralRequired: boolean;
  guidanceEnglish: string;
  guidanceYoruba: string;
}

// Structured template that Gemma 4 reliably fills in (avoids JSON hallucination issues)
const SYSTEM_INSTRUCTION = `You are MamaCare, a clinical triage AI for community health workers (CHWs) in rural Nigerian clinics specializing in maternal and child health.

DANGER SIGNS — always flag and refer urgently when present:
• Jaundice with lethargy or poor feeding in infant/neonate
• Jaundice appearing in first 24 hours of life
• Seizures or unconsciousness
• Chest wall indrawing or severe breathing difficulty
• Fever >38.5°C in neonate <7 days old
• Respiratory rate >60/min in newborn or >50/min in infant
• Severe pallor, unable to feed or breastfeed
• Postpartum hemorrhage (severe bleeding after delivery)
• Eclampsia: headache + blurred vision + swelling + high BP

DOSAGE REFERENCE (calculate from patient weight):
• Paracetamol: 15 mg/kg per dose, every 6 hours. Syrup 120mg/5ml or 250mg/5ml.
• Amoxicillin: 25 mg/kg per dose, twice daily. Syrup 125mg/5ml or 250mg/5ml.
• Cotrimoxazole: 6–8 mg/kg/day (trimethoprim), divided twice daily.
Always state: total mg dose, volume in ml, frequency, and duration.

URGENCY LEVELS:
• routine — manage at clinic, follow up in 1–2 weeks
• needs_monitoring — close observation, follow up in 24–48 hours
• urgent_referral — refer to hospital immediately without delay

You MUST fill in the following template exactly. Each field starts with its label in ALL CAPS followed by a colon. Do not skip any field. Do not add extra text outside the template.`;

const TEMPLATE = `URGENCY: [routine | needs_monitoring | urgent_referral]
CONDITIONS: [list the possible conditions]
RECOMMENDATION: [specific actions the CHW must take right now]
DOSAGE: [calculated dosage with mg and ml, or NONE if no medications requested]
DANGER_SIGN: [YES | NO]
REFERRAL: [YES | NO]
GUIDANCE_ENGLISH: [2–3 plain English sentences for the CHW]
GUIDANCE_YORUBA: [2–3 equivalent sentences in Yoruba]`;

/**
 * Parse Gemma 4's structured template response.
 * Each field is on a line: "FIELD_NAME: value"
 * Works even when Gemma adds extra prose before/after the template block.
 */
function parseTemplateResponse(text: string): TriageResult {
  // Extract value for a given field label (case-insensitive, handles multiline values until next label)
  function extract(label: string): string {
    const pattern = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`,
      "i",
    );
    const m = text.match(pattern);
    if (!m) return "";
    return m[1]
      .trim()
      .replace(/^\[|]$/g, "") // strip template brackets if model copied them
      .trim();
  }

  const urgencyRaw = extract("URGENCY").toLowerCase();
  let urgency: TriageResult["urgency"] = "needs_monitoring";
  if (urgencyRaw.includes("urgent_referral") || urgencyRaw.includes("urgent referral")) {
    urgency = "urgent_referral";
  } else if (urgencyRaw === "routine") {
    urgency = "routine";
  }

  const dangerRaw = extract("DANGER_SIGN").toLowerCase();
  const dangerSignDetected =
    dangerRaw.startsWith("yes") ||
    dangerRaw === "true" ||
    dangerRaw.includes("yes");

  const referralRaw = extract("REFERRAL").toLowerCase();
  const referralRequired =
    referralRaw.startsWith("yes") ||
    referralRaw === "true" ||
    referralRaw.includes("yes");

  const dosageRaw = extract("DOSAGE");
  const dosage =
    dosageRaw === "" || dosageRaw.toLowerCase() === "none" || dosageRaw.toLowerCase() === "null"
      ? null
      : dosageRaw;

  return {
    urgency,
    conditions: extract("CONDITIONS") || "Assessment pending",
    recommendation: extract("RECOMMENDATION") || "",
    dosage,
    dangerSignDetected,
    referralRequired,
    guidanceEnglish: extract("GUIDANCE_ENGLISH") || "",
    guidanceYoruba: extract("GUIDANCE_YORUBA") || "",
  };
}

export async function runTriage(input: TriageInput): Promise<TriageResult> {
  const age =
    input.patientAgeYears === 0
      ? "under 1 year (infant)"
      : input.patientAgeYears != null
        ? `${input.patientAgeYears} years`
        : "unknown";

  const patientBlock = [
    `Patient: ${input.patientName}`,
    `Age: ${age}`,
    input.patientWeightKg != null ? `Weight: ${input.patientWeightKg} kg` : null,
    input.patientSex ? `Sex: ${input.patientSex}` : null,
    input.previousVisitCount ? `Previous visits: ${input.previousVisitCount}` : null,
    `Symptoms: ${input.symptoms}`,
    input.medications
      ? `Medications for dosage: ${input.medications}`
      : "Dosage: none requested",
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `${patientBlock}\n\nFill in this triage form:\n\n${TEMPLATE}`;

  const parts: object[] = [];

  if (input.photoBase64) {
    const mimeType = input.photoBase64.includes("data:image/png")
      ? "image/png"
      : "image/jpeg";
    const base64Data = input.photoBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({ inlineData: { mimeType, data: base64Data } });
    parts.push({
      text: "Examine this photo for visible clinical signs (jaundice, pallor, rash, swelling, wounds). Include your visual observations in your assessment.\n\n" + userPrompt,
    });
  } else {
    parts.push({ text: userPrompt });
  }

  logger.info(
    { patient: input.patientName, hasPhoto: !!input.photoBase64 },
    "Calling Gemma 4 for triage",
  );

  const response = await ai.models.generateContent({
    model: "gemma-4-26b-a4b-it",
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: [{ role: "user", parts }],
    config: {
      maxOutputTokens: 8192,
    },
  });

  const rawText = response.text ?? "";
  logger.info({ rawText }, "Gemma 4 raw response");

  const result = parseTemplateResponse(rawText);

  // Safety override: detected danger sign always escalates urgency
  if (result.dangerSignDetected) {
    result.referralRequired = true;
    result.urgency = "urgent_referral";
  }

  logger.info(
    {
      urgency: result.urgency,
      dangerSignDetected: result.dangerSignDetected,
      referralRequired: result.referralRequired,
    },
    "Triage parsed",
  );

  return result;
}
