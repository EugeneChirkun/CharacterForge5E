export type UpdateStatus = 'unsupported' | 'registering' | 'ready' | 'update-available' | 'error';
export interface ServiceWorkerController {
  readonly supported: boolean;
  register(onStatus: (status: UpdateStatus) => void): Promise<void>;
  applyUpdate(): void;
}

export function createServiceWorkerController(): ServiceWorkerController {
  let waiting: ServiceWorker | null = null;
  return {
    supported: 'serviceWorker' in navigator,
    async register(onStatus) {
      if (!('serviceWorker' in navigator)) { onStatus('unsupported'); return; }
      onStatus('registering');
      try {
        const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
        const inspect = () => { if (registration.waiting) { waiting = registration.waiting; onStatus('update-available'); } };
        inspect();
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) inspect(); });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
        onStatus(waiting ? 'update-available' : 'ready');
      } catch { onStatus('error'); }
    },
    applyUpdate() { waiting?.postMessage({ type: 'SKIP_WAITING' }); },
  };
}
