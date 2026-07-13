import { useGetDashboardStats, useGetRecentVisits } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Activity, Users, AlertTriangle, ArrowRight, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentVisits, isLoading: visitsLoading } = useGetRecentVisits();

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm">Today's snapshot across all registered patients.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-primary-foreground/80 flex items-center gap-2">
              <Users className="w-4 h-4" /> Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {statsLoading ? <Skeleton className="h-8 w-16 bg-primary-foreground/20" /> : (
              <p className="text-3xl font-bold">{stats?.totalPatients || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" /> Visits Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-3xl font-bold text-foreground">{stats?.visitsToday || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-destructive/20 bg-destructive/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Urgent Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {statsLoading ? <Skeleton className="h-8 w-16 bg-destructive/20" /> : (
              <p className="text-3xl font-bold text-destructive">{stats?.urgentCasesToday || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Referrals (Wk)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-3xl font-bold text-foreground">{stats?.referralsThisWeek || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent Triage Cases</h2>
          <Link href="/patients" className="text-sm font-semibold text-secondary flex items-center gap-1 hover:underline">
            All Patients <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {visitsLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                </div>
              ))}
            </div>
          ) : !recentVisits?.length ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p>No recent triage visits.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentVisits.map((visit, index) => (
                <Link 
                  key={visit.id} 
                  href={`/visits/${visit.id}`}
                  className="p-4 flex flex-col sm:flex-row gap-3 hover:bg-muted/30 transition-colors block animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className="font-bold text-foreground hover:text-primary transition-colors">
                        {visit.patientName}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {visit.symptoms}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDistanceToNow(new Date(visit.createdAt), { addSuffix: true })}
                        </span>
                        {visit.dangerSignDetected && (
                          <span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Danger Sign</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <UrgencyBadge urgency={visit.urgency} />
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
}
