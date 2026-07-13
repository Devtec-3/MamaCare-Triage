import { useGetVisit, getGetVisitQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { ArrowLeft, AlertTriangle, ShieldCheck, Activity, Pill, User, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function VisitDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: visit, isLoading } = useGetVisit(id, { 
    query: { enabled: !!id, queryKey: getGetVisitQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Visit record not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/patients">Return to Registry</Link>
        </Button>
      </div>
    );
  }

  const isUrgent = visit.referralRequired || visit.urgency === 'urgent_referral';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {format(new Date(visit.createdAt), 'MMM d, yyyy • h:mm a')}
        </div>
      </div>

      {isUrgent && (
        <div className="bg-destructive text-destructive-foreground p-6 rounded-xl shadow-lg border border-destructive-foreground/20 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-10 h-10 shrink-0" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
                REFER TO HOSPITAL NOW
              </h2>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white/90">
                Wahala Nla! Lọ si Ile-Isan Lẹsẹkẹsẹ!
              </h3>
              <p className="mt-3 text-white/80 font-medium">
                Do not delay. Arrange transport immediately. Follow pre-referral treatment below.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isUrgent && visit.urgency === 'routine' && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg">Routine Care</h3>
            <p className="text-emerald-700 font-medium text-sm">Follow standard treatment protocols. No immediate danger signs detected.</p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Triage Result</p>
          <div className="flex items-center gap-3">
            <UrgencyBadge urgency={visit.urgency} className="text-base px-4 py-1" />
            {visit.dangerSignDetected && (
              <span className="bg-destructive/10 text-destructive font-bold px-3 py-1 rounded-full text-sm border border-destructive/20 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Danger Sign
              </span>
            )}
          </div>
        </div>
        
        <Button asChild variant="outline" className="shrink-0 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 font-bold">
          <Link href={`/patients/${visit.patientId}`}>
            <User className="w-4 h-4 mr-2" /> View Patient Profile
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Guidance */}
        <div className="space-y-6">
          <Card className="border-border shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Action Plan & Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-5 border-b border-border">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">English</h4>
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{visit.guidanceEnglish}</p>
              </div>
              <div className="p-5 bg-muted/30">
                <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                  Yoruba Translation
                </h4>
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap font-medium">{visit.guidanceYoruba}</p>
              </div>
            </CardContent>
          </Card>

          {visit.dosage && (
            <Card className="border-secondary/30 shadow-md overflow-hidden bg-secondary/5">
              <CardHeader className="pb-3 border-b border-secondary/10">
                <CardTitle className="text-lg flex items-center gap-2 text-secondary-foreground">
                  <Pill className="w-5 h-5 text-secondary" />
                  Dosage Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-base font-bold text-foreground">{visit.dosage}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Case Details */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Suspected Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-lg font-bold text-foreground">{visit.conditions}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-bold text-muted-foreground mb-1">AI Recommendation Context</h4>
                <p className="text-sm text-foreground leading-relaxed">{visit.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Reported Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{visit.symptoms}</p>
              
              {visit.photoBase64 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-bold text-muted-foreground mb-3">Clinical Photo</h4>
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                    <img 
                      src={visit.photoBase64} 
                      alt="Clinical symptom" 
                      className="w-full h-auto max-h-[400px] object-contain bg-black/5" 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
