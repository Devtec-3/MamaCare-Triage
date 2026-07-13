import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Home, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/patients", icon: Users, label: "Patients" },
    { href: "/patients/new", icon: Plus, label: "Register" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-16 md:pb-0 md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary text-primary-foreground border-r border-primary-border shrink-0 fixed inset-y-0 z-20">
        <div className="p-6 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">MamaCare</h1>
              <p className="text-xs text-primary-foreground/70 font-medium">Triage Assistant</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-secondary text-secondary-foreground shadow-sm" 
                  : "hover:bg-white/10 text-primary-foreground/90 hover:text-white"
              )}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-secondary" />
          <h1 className="text-lg font-bold tracking-tight">MamaCare</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:pl-64 flex flex-col relative z-0">
        <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex items-center justify-around p-2 pb-safe z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <div className={cn(
                "p-1.5 rounded-full",
                isActive ? "bg-primary/10" : ""
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
