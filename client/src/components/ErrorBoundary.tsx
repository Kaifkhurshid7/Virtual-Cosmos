import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Cosmic space:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border border-red-500/20 space-y-6 text-center max-w-lg mx-auto mt-24">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Cosmic Distortion</h2>
            <p className="text-gray-400 text-sm">
              The neural link to the cosmos encountered a runtime error. 
              {this.state.error && <span className="block mt-2 font-mono text-red-400 opacity-70">{this.state.error.message}</span>}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl transition-all font-medium text-sm border border-white/10"
          >
            <RefreshCw size={16} />
            Re-establish Link
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
