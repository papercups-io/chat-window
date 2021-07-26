class Logger {
  debugModeEnabled: boolean;

  constructor(debugModeEnabled?: boolean) {
    this.debugModeEnabled = !!debugModeEnabled;
  }

  debug(...args: any) {
    if (!this.debugModeEnabled) {
      return;
    }

    console.debug('[Papercups iframe]', ...args);
  }

  log(...args: any) {
    if (!this.debugModeEnabled) {
      return;
    }

    console.log('[Papercups iframe]', ...args);
  }

  info(...args: any) {
    console.info('[Papercups iframe]', ...args);
  }

  warn(...args: any) {
    console.warn('[Papercups iframe]', ...args);
  }

  error(...args: any) {
    console.error('[Papercups iframe]', ...args);
  }
}

export default Logger;
