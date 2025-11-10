import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressIndicator = ({ current, total, label }: ProgressIndicatorProps) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="space-y-2" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={label || `Progreso: ${percentage}%`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label || "Progreso"}</span>
        <span className="font-medium">{current} / {total}</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <span className="sr-only">{percentage}% completado</span>
    </div>
  );
};
