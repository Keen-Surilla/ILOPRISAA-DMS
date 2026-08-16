import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  sanitizedMessage: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

export class SecureErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, sanitizedMessage: null };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
      sanitizedMessage: "We couldn't connect to the server right now. Please refresh the page or try again in a few moments.",
    };
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) {
      console.error('[ILOPRISAA ErrorBoundary]', error);
    } else {
      console.error('[ILOPRISAA] Unhandled error in render tree. Code:', error.name ?? 'UNKNOWN');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, sanitizedMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[200px] flex flex-col items-center justify-center gap-1 p-8 text-center"
        >
          <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        className="mb-6 text-blue-300"
      >
        <rect x="45" y="35" width="50" height="45" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="60" cy="55" r="4" fill="currentColor" />
        <circle cx="80" cy="55" r="4" fill="currentColor" />
        <path d="M58 68 Q70 62 82 68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <line x1="70" y1="35" x2="70" y2="22" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="70" cy="18" r="4" stroke="currentColor" strokeWidth="2.5" />
        <rect x="30" y="85" width="15" height="25" rx="4" stroke="currentColor" strokeWidth="2.5" transform="rotate(-15 37 97)" />
        <rect x="95" y="85" width="15" height="25" rx="4" stroke="currentColor" strokeWidth="2.5" transform="rotate(15 102 97)" />
        <line x1="20" y1="115" x2="35" y2="105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="105" y1="105" x2="120" y2="115" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <circle cx="18" cy="118" r="2.5" fill="currentColor" opacity="0.4" />
        <circle cx="122" cy="118" r="2.5" fill="currentColor" opacity="0.4" />
      </svg>

          <h2 className="text-lg font-bold text-slate-700 mb-1.5">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mb-5">
            {this.state.sanitizedMessage}
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}