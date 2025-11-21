import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (import.meta.env.PROD) return;

    // Interceptar console.log, console.warn, console.error
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level: LogEntry['level'], args: any[]) => {
      const message = args
        .map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
        .join(' ');
      
      setLogs(prev => [
        ...prev.slice(-49), // Mantener últimos 50 logs
        {
          timestamp: new Date(),
          level,
          message,
          data: args.find(arg => typeof arg === 'object')
        }
      ]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    // Mostrar panel automáticamente si hay errores
    const errorListener = () => {
      setIsVisible(true);
      setIsMinimized(false);
    };
    window.addEventListener('error', errorListener);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener('error', errorListener);
    };
  }, []);

  // No mostrar en producción
  if (import.meta.env.PROD) return null;

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full shadow-lg"
        size="icon"
        variant="outline"
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex gap-2">
        <Badge 
          variant={logs.some(l => l.level === 'error') ? 'destructive' : 'secondary'}
          className="cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          {logs.filter(l => l.level === 'error').length} errores
        </Badge>
        <Button
          onClick={() => setIsVisible(false)}
          size="icon"
          variant="ghost"
          className="h-8 w-8"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  return (
    <Card className="fixed bottom-4 right-4 z-[9999] w-96 h-96 shadow-2xl border-2">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">🔍 Debug Panel</span>
          <div className="flex gap-1">
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errorCount} ❌
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {warnCount} ⚠️
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={() => setLogs([])}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            onClick={() => setIsMinimized(true)}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100%-48px)]">
        <div className="p-2 space-y-1">
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay logs todavía
            </p>
          )}
          {logs.map((log, i) => (
            <div
              key={i}
              className={`text-xs p-2 rounded border ${
                log.level === 'error'
                  ? 'bg-destructive/10 border-destructive/20'
                  : log.level === 'warn'
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-muted/50 border-border/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="flex-1 break-words font-mono">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
