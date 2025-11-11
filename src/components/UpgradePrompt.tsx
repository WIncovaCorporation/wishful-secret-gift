import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Crown, Zap } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  onDismiss?: () => void;
  variant?: 'card' | 'banner';
}

export function UpgradePrompt({ title, description, feature, onDismiss, variant = 'card' }: UpgradePromptProps) {
  const navigate = useNavigate();

  if (variant === 'banner') {
    return (
      <Alert className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
        <Crown className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div>
            <strong className="font-semibold">{title}</strong>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => navigate('/pricing')} className="gap-2">
              <Zap className="w-4 h-4" />
              Actualizar
            </Button>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Después
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={() => navigate('/pricing')} className="flex-1">
          Actualizar a Premium
        </Button>
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            Después
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
