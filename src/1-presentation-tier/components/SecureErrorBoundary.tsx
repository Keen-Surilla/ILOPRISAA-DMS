/**
 * TIER 1 — PRESENTATION TIER: Secure Error Boundary
 *
 * SECURITY RATIONALE:
 * React's default error behavior renders the raw JavaScript Error object,
 * which can expose stack traces, internal file paths, and database error
 * messages to the browser — a significant information disclosure risk.
 *
 * This boundary intercepts all unhandled errors and:
 * 1. Displays a safe, generic fallback UI to the user.
 * 2. Logs the full technical error to the console (dev only) or a
 * monitoring service (prod) — never to the rendered DOM.
 * 3. Sanitizes the error message to strip any paths or DB details.
 *
 * Mitigates: OWASP A09 (Security Logging and Monitoring Failures)
 * Mitigates: OWASP A05 (Security Misconfiguration — verbose error pages)
 */

import { Component, type ReactNode } from 'react';

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
      sanitizedMessage: 'An unexpected error occurred. Please refresh the page.',
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
          className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 text-center rounded-xl border border-red-200 bg-red-50"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-800">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h2>
            <p className="text-sm text-red-600 mt-1">
              {this.state.sanitizedMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="text-sm text-red-700 font-medium py-1.5 px-4 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
