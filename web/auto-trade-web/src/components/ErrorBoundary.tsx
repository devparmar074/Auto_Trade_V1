import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              An unexpected render error occurred while updating market components.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono text-rose-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-950/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
