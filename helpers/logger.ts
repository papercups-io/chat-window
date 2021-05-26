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

    console.debug(...args);
  }

  log(...args: any): void {
    if (!this.debugModeEnabled) {
      return;
    }

    console.log(...args);
  }

  info(...args: any): void {
    console.info(...args);
  }

  warn(...args: any): void {
    console.warn(...args);
  }

  error(...args: any): void {
    console.error(...args);
  }
}

export default Logger;
