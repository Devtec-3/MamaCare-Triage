import { useGetPatient, getGetPatientQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { User, Activity, MapPin, Phone, Weight, PlusCircle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UrgencyBadge } from "@/components/urgency-badge";
import { format, formatDistanceToNow } from "date-fns";

export default function PatientProfile() {
  const params = useParams();
  const id = Number(params.id);

  const { data: patient, isLoading } = useGetPatient(id, { 
    query: { enabled: !!id, queryKey: getGetPatientQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/patients">Return to Registry</Link>
        </Button>
      </div>
    );
  }

  const visits = [...(patient.visits || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{patient.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
                {patient.ageYears ? `${patient.ageYears} years` : 'Age unknown'} 
                {patient.sex && <span className="capitalize">• {patient.sex}</span>}
              </p>
            </div>
          </div>
          
          <Button asChild size="lg" className="w-full sm:w-auto font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md">
            <Link href={`/patients/${patient.id}/triage`}>
              <Activity className="w-5 h-5 mr-2" />
              Start New Triage
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center text-muted-foreground text-sm font-medium">
            <MapPin className="w-4 h-4 mr-1.5" /> Village
          </div>
          <p className="font-semibold text-foreground">{patient.village || '—'}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-muted-foreground text-sm font-medium">
            <Phone className="w-4 h-4 mr-1.5" /> Phone
          </div>
          <p className="font-semibold text-foreground">{patient.phoneNumber || '—'}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-muted-foreground text-sm font-medium">
            <Weight className="w-4 h-4 mr-1.5" /> Weight
          </div>
          <p className="font-semibold text-foreground">{patient.weightKg ? `${patient.weightKg} kg` : '—'}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-muted-foreground text-sm font-medium">
            <Clock className="w-4 h-4 mr-1.5" /> Registered
          </div>
          <p className="font-semibold text-foreground">
            {format(new Date(patient.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Visit History</h2>
        
        {!visits.length ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-foreground mb-1">No triage visits yet</p>
            <p className="text-sm">Start a new triage session to record symptoms and get guidance.</p>
            <Button asChild variant="outline" className="mt-4 font-semibold border-primary/20 text-primary">
              <Link href={`/patients/${patient.id}/triage`}>
                <PlusCircle className="w-4 h-4 mr-2" /> Start First Triage
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit, index) => (
              <Link key={visit.id} href={`/visits/${visit.id}`}>
                <div 
                  className="bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all p-5 rounded-xl cursor-pointer group relative overflow-hidden"
                >
                  {/* Decorative side bar for urgency */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    visit.urgency === 'urgent_referral' ? 'bg-destructive' :
                    visit.urgency === 'needs_monitoring' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center pl-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-lg">
                          {format(new Date(visit.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          ({formatDistanceToNow(new Date(visit.createdAt), { addSuffix: true })})
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 pr-4">{visit.symptoms}</p>
                      
                      <div className="flex gap-2 items-center flex-wrap pt-1">
                        <UrgencyBadge urgency={visit.urgency} />
                        {visit.dangerSignDetected && (
                          <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20">
                            Danger Sign
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <Button variant="ghost" className="text-primary hover:text-primary group-hover:bg-primary/5 w-full sm:w-auto">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
