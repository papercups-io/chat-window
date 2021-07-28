import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const isSentryEnabled = !!SENTRY_DSN;

export const init = () => {
  if (isSentryEnabled) {
    Sentry.init({dsn: SENTRY_DSN});
  }
};

export const identify = (id: any, email: string) => {
  if (isSentryEnabled) {
    Sentry.setUser({id, email});
  }
};

export default {
  init,
  identify,
};
