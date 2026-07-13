import { useState, useMemo } from "react";
import { useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, UserPlus, FileText, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// Debounce hook for search input
function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function PatientsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: patients, isLoading } = useListPatients(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListPatientsQueryKey({ search: debouncedSearch || undefined }) } }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patients Registry</h1>
          <p className="text-sm text-muted-foreground">Search and manage patient records.</p>
        </div>
        <Button asChild className="w-full sm:w-auto font-bold shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link href="/patients/new">
            <UserPlus className="w-4 h-4 mr-2" />
            New Patient
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          placeholder="Search by name, village, or phone..." 
          className="pl-10 h-12 text-base bg-card border-border shadow-sm rounded-xl focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex gap-4 items-center">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          ))
        ) : !patients?.length ? (
          <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center border border-dashed border-border rounded-xl bg-card/50">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-foreground">No patients found</p>
            <p className="text-sm mt-1">Try adjusting your search or register a new patient.</p>
          </div>
        ) : (
          patients.map((patient, index) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <div 
                className="bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all p-4 rounded-xl flex items-start gap-4 cursor-pointer group animate-in slide-in-from-bottom-4 fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate text-lg leading-tight group-hover:text-primary transition-colors">
                    {patient.name}
                  </h3>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-3 mt-1">
                    <span>{patient.ageYears ? `${patient.ageYears} yrs` : 'Age unknown'}</span>
                    {patient.sex && <span className="capitalize">• {patient.sex}</span>}
                  </div>
                  {patient.village && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{patient.village}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
