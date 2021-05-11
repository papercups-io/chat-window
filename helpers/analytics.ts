import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const isSentryEnabled = !!SENTRY_DSN;

export const init = (): void => {
  if (isSentryEnabled) {
    Sentry.init({dsn: SENTRY_DSN});
  }
};

export const identify = (id: string, email: string): void => {
  if (isSentryEnabled) {
    Sentry.setUser({id, email});
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  init,
  identify,
};
