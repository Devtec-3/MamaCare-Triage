import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors border",
  {
    variants: {
      urgency: {
        routine: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        needs_monitoring: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        urgent_referral: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground font-bold px-3 py-1 text-sm shadow-sm",
      },
    },
    defaultVariants: {
      urgency: "routine",
    },
  }
);

interface UrgencyBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  urgency: string;
}

export function UrgencyBadge({ className, urgency, ...props }: UrgencyBadgeProps) {
  const normalizedUrgency = urgency.toLowerCase().replace(" ", "_") as any;
  
  const labels: Record<string, string> = {
    routine: "Routine",
    needs_monitoring: "Needs Monitoring",
    urgent_referral: "Urgent Referral",
  };

  return (
    <div className={cn(badgeVariants({ urgency: normalizedUrgency }), className)} {...props}>
      {labels[normalizedUrgency] || urgency}
    </div>
  );
}
