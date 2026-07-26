import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/print.css';
import { ApplicationErrorBoundary } from './components/ApplicationErrorBoundary';
import { applicationUpdateController } from './application/updates/application-update-controller';
import { UpdateAvailableBanner } from './features/updates/UpdateAvailableBanner';
import { useEffect, useState } from 'react';
function Root() {
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    const unsubscribe = applicationUpdateController.subscribe((status) => setUpdate(status === 'update-available'));
    if (import.meta.env.PROD) void applicationUpdateController.start();
    return unsubscribe;
  }, []);
  return <ApplicationErrorBoundary><App />{update && <UpdateAvailableBanner onUpdate={() => applicationUpdateController.updateNow()} onDismiss={() => setUpdate(false)} />}</ApplicationErrorBoundary>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
