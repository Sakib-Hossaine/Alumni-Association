import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering error", error, info);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
          <div className="card max-w-md p-8 text-center">
            <h1 className="text-xl font-bold">We hit a snag</h1>
            <p className="mt-2 text-sm text-slate-500">
              Reload the page to continue using your alumni workspace.
            </p>
            <button
              className="btn btn-primary mt-5"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <div>
              <a className="mt-4 inline-block text-sm text-teal" href="/login">
                Back to sign in
              </a>
            </div>
          </div>
        </div>
      );
    return this.props.children;
  }
}
