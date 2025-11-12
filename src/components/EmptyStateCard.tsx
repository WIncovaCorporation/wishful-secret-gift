/**
 * EmptyStateCard Component
 * Fix #P1-UX-001: Informative empty states with clear CTAs
 */

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyStateCard = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateCardProps) => {
  return (
    <Card className="border-2 border-dashed border-border/50 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        
        <p className="text-muted-foreground mb-8 max-w-md text-base leading-relaxed">
          {description}
        </p>
        
        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={onAction} size="lg" className="gap-2">
            {actionLabel}
          </Button>
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              onClick={onSecondaryAction} 
              variant="outline" 
              size="lg"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
