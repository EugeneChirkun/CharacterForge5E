import { APPLICATION_VERSION } from '../config/application-version';

export interface ApplicationBuildInfo {
  readonly version: string;
  readonly commit?: string;
  readonly builtAt?: string;
}

export const APPLICATION_BUILD_INFO: ApplicationBuildInfo = Object.freeze({
  version: APPLICATION_VERSION,
});
