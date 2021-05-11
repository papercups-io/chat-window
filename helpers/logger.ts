/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
class Logger {
  debugModeEnabled: boolean;

  constructor(debugModeEnabled?: boolean) {
    this.debugModeEnabled = !!debugModeEnabled;
  }

  debug(...args: any): void {
    if (!this.debugModeEnabled) {
      return;
    }

    console.debug('[Papercups iframe]', ...args);
  }

  log(...args: any): void {
    if (!this.debugModeEnabled) {
      return;
    }

    console.log('[Papercups iframe]', ...args);
  }

  info(...args: any): void {
    console.info('[Papercups iframe]', ...args);
  }

  warn(...args: any): void {
    console.warn('[Papercups iframe]', ...args);
  }

  error(...args: any): void {
    console.error('[Papercups iframe]', ...args);
  }
}

export default Logger;
