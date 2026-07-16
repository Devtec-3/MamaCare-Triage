 MAMACARE TRIAGE
 
 <img width="1568" height="784" alt="MAMAWARE" src="https://github.com/user-attachments/assets/2e9f21f9-ef0d-4e4f-bafe-359112037ba8" />

**A multimodal, offline-first AI health triage assistant for rural maternal & newborn care — built with Gemma 4.**

Built for the *Build with Gemma 4: GenAI for SDGs* Hackathon — Kwara State University
**Track:** Better Healthcare (SDG 3: Good Health)

🔗 **Live Demo:** [mamacare-triage.onrender.com](https://mamacare-triage.onrender.com)

📦 **Repo:** [github.com/Devtec-3/MamaCare-Triage](https://github.com/Devtec-3/MamaCare-Triage)



## THE PROBLEM

Rural clinics in Nigeria are often staffed by community health workers (CHWs) rather than doctors, with unreliable internet access and thin drug stock. Maternal and newborn mortality remains one of the most severe gaps under SDG 3 , frequently driven not by a lack of willingness to act, but by delayed recognition of danger signs.

Existing AI health tools don't fit this reality. Most are text-only, single-turn chatbots that assume constant connectivity and English literacy  none of which hold in a rural clinic.

**MamaCare Triage** closes that gap directly, using Gemma 4 as the reasoning core of an agent that goes beyond advice into real, actionable output.



## WHAT IT DOES

<img width="725" height="1568" alt="MAM1" src="https://github.com/user-attachments/assets/48e283bf-240e-442a-95ea-dbbba49a9329" />


A CHW enters basic patient details (age, weight, symptoms), attaches a photo of a visible symptom, and receives back:

- ✅ A condition and urgency assessment (routine / needs monitoring / urgent referral) from Gemma 4
- ✅ A safe medication dosage — or an explicit withholding of one, when no CHW-administered option is clinically appropriate
- 🚨 A danger-sign flag that triggers a full-width **"REFER TO HOSPITAL NOW"** alert when warranted
- 🗣️ Guidance translated into **Yoruba**, for CHWs more comfortable outside English



## HOW GEMMA 4 IS USED

### 1. Multimodal Reasoning
The model receives a patient photo alongside structured text (age, weight, symptom notes) in a single call, returning a reasoned clinical judgment not just an image description.

### 2. Native Function Calling
Gemma calls real tools rather than describing what should happen in prose:

| Function | Purpose |
|---|---|
| `calculate_dosage(weight, age, medication)` | Returns a safe dosage in mg, tablet count or syrup volume, and frequency — or `null` if no CHW-administered option is appropriate |
| `flag_danger_sign(symptoms)` | Checks the case against WHO / Nigerian maternal-newborn danger-sign criteria; returns a boolean plus reasoning |

This distinction matters: a function call with defined parameters and a return value is auditable in a way that prose advice is not.

Model used: **`gemma-4-26b-a4b-it`**, called via the Gemini API.



## TECH STACK

- **Frontend:** React + Vite + Tailwind CSS (mobile-first)
- **Backend:** Node.js / Express
- **AI:** Gemma 4 (`gemma-4-26b-a4b-it`) via Gemini API
- **Database:** PostgreSQL (Drizzle ORM)  patients, visits, conversations, messages
- **Deployment:** Render



## ARCHITECTURE

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  React Frontend  │ ───► │  Express API      │ ───► │  Gemma 4 (Gemini │
│  (Vite + Tailwind)│ ◄──── │  (api-server)      │ ◄──── │  API)            │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  PostgreSQL       │
                          │  (patients, visits)│
                          └──────────────────┘
```

The Express server serves both the API (`/api/*`) and the built frontend static files, with an SPA fallback so client-side routes don't 404 on refresh.



## VALIDATION & TEST RESULTS

Both extremes of the dosage-calling and danger-sign-flag behavior were deliberately tested:

**CASE:-  1 — 6-month-old infant, jaundice + poor feeding:**


<img width="725" height="1568" alt="MAM3" src="https://github.com/user-attachments/assets/95dc341f-590c-45b3-b3fd-9d2babb2eb93" />


- Urgency: `urgent_referral`
- Conditions identified: Hyperbilirubinemia (Jaundice), Sepsis, Lethargy
- Dosage: `null` , correctly withheld (no safe CHW-administered option for this presentation)
- Danger sign: `true` → triggers referral banner
- Yoruba translation: accurate



**CASE 2:-   52kg adult, 20 weeks pregnant, mild fever (37.6°C), no danger signs:**


<img width="725" height="1568" alt="MAM4" src="https://github.com/user-attachments/assets/4664c017-31c0-430b-9934-bd61d9140f65" />


- Urgency: `needs_monitoring` , correctly not escalated
- Dosage: 500–1000mg (1–2 tablets) every 4–6 hours , matches standard adult paracetamol dosing (15mg/kg × 52kg = 780mg)
- Danger sign: `false` , no false positive
- Yoruba translation: complete, including pregnancy-specific warning signs


## GETTING STARTED (Local Development)

```bash
# Clone the repo
git clone https://github.com/Devtec-3/MamaCare-Triage.git
cd MamaCare-Triage

# Install dependencies
pnpm install

# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export DATABASE_URL="your-postgres-connection-string"

# Push database schema
pnpm --filter @workspace/db run push

# Run the app
pnpm start
```

### REQUIRED ENVIRONMENT VARIABLES

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `DATABASE_URL` | PostgreSQL connection string |

---

## CHALLENGES OVERCOME

1. **Structured output reliability** :- switched from raw JSON parsing to a line-by-line text template Gemma reliably fills in, parsed server-side.
2. **API parameter incompatibility** :-  the `temperature` parameter caused 500 errors on this Gemma 4 endpoint; removed and verified in production.
3. **Model identity accuracy** :- ensured all code and docs correctly reference Gemma 4, not a Gemini model.
4. **Production deployment hardening** :- resolved strict TypeScript build failures, a monorepo build script pulling in an unrelated internal dev tool, build-time vs. runtime environment variable handling, a missing production `start` script, database provisioning and schema migration, and a wildcard SPA-fallback route incompatible with a newer routing library version.


## LIMITATIONS & FUTURE WORK

- Current inference uses the Gemma 4 API rather than fully on-device inference; a quantized local build (e.g. GGUF) is a natural next step for true offline field operation
- Audio-based symptom analysis (e.g. infant cough/breathing sounds) and a drug-stock lookup tool are scoped as future features
- Only Yoruba is currently supported for local-language output; Hausa, Igbo, and Pidgin are planned
- Danger-sign criteria are a curated subset of WHO/Nigerian guidelines; a full clinical review is needed before real-world deployment

---

## License

MIT


Built by **Devtec Technology** ([@devtec3](https://github.com/Devtec-3)) for the Build with Gemma 4: GenAI for SDGs Hackathon.
