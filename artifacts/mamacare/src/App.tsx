import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout';

// Pages
import Dashboard from '@/pages/dashboard';
import PatientsList from '@/pages/patients-list';
import PatientNew from '@/pages/patient-new';
import PatientProfile from '@/pages/patient-profile';
import TriageForm from '@/pages/triage-form';
import VisitDetail from '@/pages/visit-detail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/patients" component={PatientsList} />
        <Route path="/patients/new" component={PatientNew} />
        <Route path="/patients/:id" component={PatientProfile} />
        <Route path="/patients/:id/triage" component={TriageForm} />
        <Route path="/visits/:id" component={VisitDetail} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
