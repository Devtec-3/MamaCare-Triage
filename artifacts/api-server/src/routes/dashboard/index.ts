import { Router, type IRouter } from "express";
import { sql, eq, desc } from "drizzle-orm";
import { db, patientsTable, visitsTable } from "@workspace/db";
import { GetDashboardStatsResponse, GetRecentVisitsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const [totalPatientsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable);

  const [visitsTodayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(visitsTable)
    .where(sql`${visitsTable.createdAt} >= ${today.toISOString()}`);

  const [urgentTodayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(visitsTable)
    .where(
      sql`${visitsTable.createdAt} >= ${today.toISOString()} AND ${visitsTable.urgency} = 'urgent_referral'`,
    );

  const [visitsWeekRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(visitsTable)
    .where(sql`${visitsTable.createdAt} >= ${weekAgo.toISOString()}`);

  const [referralsWeekRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(visitsTable)
    .where(
      sql`${visitsTable.createdAt} >= ${weekAgo.toISOString()} AND ${visitsTable.referralRequired} = true`,
    );

  res.json(
    GetDashboardStatsResponse.parse({
      totalPatients: totalPatientsRow?.count ?? 0,
      visitsToday: visitsTodayRow?.count ?? 0,
      urgentCasesToday: urgentTodayRow?.count ?? 0,
      visitsThisWeek: visitsWeekRow?.count ?? 0,
      referralsThisWeek: referralsWeekRow?.count ?? 0,
    }),
  );
});

router.get("/dashboard/recent-visits", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: visitsTable.id,
      patientId: visitsTable.patientId,
      patientName: patientsTable.name,
      symptoms: visitsTable.symptoms,
      urgency: visitsTable.urgency,
      dangerSignDetected: visitsTable.dangerSignDetected,
      referralRequired: visitsTable.referralRequired,
      guidanceEnglish: visitsTable.guidanceEnglish,
      createdAt: visitsTable.createdAt,
    })
    .from(visitsTable)
    .innerJoin(patientsTable, eq(visitsTable.patientId, patientsTable.id))
    .orderBy(desc(visitsTable.createdAt))
    .limit(20);

  res.json(GetRecentVisitsResponse.parse(rows));
});

export default router;
