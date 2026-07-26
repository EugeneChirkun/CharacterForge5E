import { createServiceWorkerController, type UpdateStatus } from '../../infrastructure/pwa/service-worker-registration';
type Listener = (status: UpdateStatus) => void;
class ApplicationUpdateController {
  private readonly worker = createServiceWorkerController();
  private listeners = new Set<Listener>();
  status: UpdateStatus = this.worker.supported ? 'registering' : 'unsupported';
  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.status); return () => { this.listeners.delete(listener); }; }
  async start() { await this.worker.register((status) => { this.status = status; this.listeners.forEach((listener) => listener(status)); }); }
  updateNow() { this.worker.applyUpdate(); }
}
export const applicationUpdateController = new ApplicationUpdateController();
