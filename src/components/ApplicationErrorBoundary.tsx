import { Component, type ErrorInfo, type ReactNode } from 'react';
import { APPLICATION_VERSION } from '../config/application-version';
import { applicationLogger } from '../infrastructure/logging/application-logger';
export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_: Error, info: ErrorInfo) { applicationLogger.log('error', 'react-error-boundary', { componentStackAvailable: Boolean(info.componentStack) }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="center-page" role="alert"><h1>Character Forge needs to recover</h1><p>An unexpected application error occurred. Your private character details have not been included in this message.</p><p>Application version: {APPLICATION_VERSION}</p><button type="button" onClick={() => location.reload()}>Reload application</button>{' '}<a className="button secondary" href={`${import.meta.env.BASE_URL}#/characters`}>Return to characters</a></main>;
  }
}
