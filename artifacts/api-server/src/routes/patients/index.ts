import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, patientsTable } from "@workspace/db";
import {
  CreatePatientBody,
  CreatePatientResponse,
  GetPatientParams,
  GetPatientResponse,
  ListPatientsQueryParams,
  ListPatientsResponse,
  UpdatePatientBody,
  UpdatePatientParams,
  UpdatePatientResponse,
} from "@workspace/api-zod";
import { visitsTable } from "@workspace/db";

const router: IRouter = Router();

function mapPatient(p: typeof patientsTable.$inferSelect) {
  return {
    ...p,
    weightKg: p.weightKg != null ? parseFloat(p.weightKg as string) : null,
  };
}

router.get("/patients", async (req, res): Promise<void> => {
  const query = ListPatientsQueryParams.safeParse(req.query);
  let patients;
  if (query.success && query.data.search) {
    patients = await db
      .select()
      .from(patientsTable)
      .where(ilike(patientsTable.name, `%${query.data.search}%`))
      .orderBy(desc(patientsTable.createdAt));
  } else {
    patients = await db
      .select()
      .from(patientsTable)
      .orderBy(desc(patientsTable.createdAt));
  }
  res.json(ListPatientsResponse.parse(patients.map(mapPatient)));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .insert(patientsTable)
    .values({
      ...parsed.data,
      weightKg: parsed.data.weightKg != null ? String(parsed.data.weightKg) : undefined,
    })
    .returning();

  res.status(201).json(CreatePatientResponse.parse(mapPatient(patient)));
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid patient id" });
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

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.patientId, params.data.id))
    .orderBy(desc(visitsTable.createdAt));

  const mapped = mapPatient(patient);
  res.json(
    GetPatientResponse.parse({
      ...mapped,
      visits,
    }),
  );
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid patient id" });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .update(patientsTable)
    .set({
      ...parsed.data,
      weightKg: parsed.data.weightKg != null ? String(parsed.data.weightKg) : undefined,
    })
    .where(eq(patientsTable.id, params.data.id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(UpdatePatientResponse.parse(mapPatient(patient)));
});

export default router;
