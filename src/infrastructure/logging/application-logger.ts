import { APPLICATION_VERSION } from '../../config/application-version';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface ApplicationLogger { log(level: LogLevel, code: string, context?: Readonly<Record<string, string | number | boolean>>): void }
export const applicationLogger: ApplicationLogger = {
  log(level, code, context) {
    if (import.meta.env.PROD && (level === 'debug' || level === 'info')) return;
    console[level](`[CharacterForge5E ${APPLICATION_VERSION}] ${code}`, context ?? {});
  },
};
