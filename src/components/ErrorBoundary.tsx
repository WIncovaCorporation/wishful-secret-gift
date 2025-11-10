/**
 * Error Boundary Component
 * Fix #04: Integrate Sentry for error monitoring and tracking
 * Catches React component errors and reports them to Sentry
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '@/lib/sentry';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Algo salió mal
            </h1>
            <p className="text-muted-foreground mb-6">
              Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando en solucionarlo.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-muted p-4 rounded-md mb-4 text-left overflow-auto max-h-40">
                <code className="text-xs text-foreground">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Intentar de nuevo
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
