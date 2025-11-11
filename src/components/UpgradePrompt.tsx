import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  onDismiss?: () => void;
}

export function UpgradePrompt({ title, description, feature, onDismiss }: UpgradePromptProps) {
  const navigate = useNavigate();

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
