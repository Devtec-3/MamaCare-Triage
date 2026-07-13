import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, patientsTable, visitsTable } from "@workspace/db";
import {
  CreateVisitBody,
  CreateVisitParams,
  CreateVisitResponse,
  GetVisitParams,
  GetVisitResponse,
  ListPatientVisitsParams,
  ListPatientVisitsResponse,
} from "@workspace/api-zod";
import { runTriage } from "../../lib/triage";

const router: IRouter = Router();

router.get("/patients/:id/visits", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListPatientVisitsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.patientId, params.data.id))
    .orderBy(desc(visitsTable.createdAt));

  res.json(ListPatientVisitsResponse.parse(visits));
});

router.post("/patients/:id/visits", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateVisitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }

  const body = CreateVisitBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  // Count previous visits for context
  const allVisits = await db
    .select({ id: visitsTable.id })
    .from(visitsTable)
    .where(eq(visitsTable.patientId, params.data.id));

  req.log.info({ patientId: params.data.id }, "Running AI triage");

  const triageResult = await runTriage({
    patientName: patient.name,
    patientAgeYears: patient.ageYears ?? null,
    patientWeightKg: patient.weightKg != null ? parseFloat(patient.weightKg as string) : null,
    patientSex: patient.sex ?? null,
    symptoms: body.data.symptoms,
    photoBase64: body.data.photoBase64 ?? null,
    medications: body.data.medications ?? null,
    previousVisitCount: allVisits.length,
  });

  const [visit] = await db
    .insert(visitsTable)
    .values({
      patientId: params.data.id,
      symptoms: body.data.symptoms,
      photoBase64: body.data.photoBase64 ?? null,
      urgency: triageResult.urgency,
      conditions: triageResult.conditions,
      recommendation: triageResult.recommendation,
      dosage: triageResult.dosage ?? null,
      dangerSignDetected: triageResult.dangerSignDetected,
      referralRequired: triageResult.referralRequired,
      guidanceEnglish: triageResult.guidanceEnglish,
      guidanceYoruba: triageResult.guidanceYoruba,
    })
    .returning();

  req.log.info({ visitId: visit.id, urgency: triageResult.urgency }, "Triage complete");

  res.status(201).json(CreateVisitResponse.parse(visit));
});

router.get("/visits/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetVisitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid visit id" });
    return;
  }

  const [visit] = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.id, params.data.id));

  if (!visit) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }

  res.json(GetVisitResponse.parse(visit));
});

export default router;
