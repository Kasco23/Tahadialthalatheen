/**
 * Production-safe logging utility
 * Logs are only output when in development mode
 */

const isDevelopment = process.env.NODE_ENV !== "production";

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

class Logger {
  private static shouldLog(level: LogLevel): boolean {
    if (!isDevelopment) {
      // Only show errors in production
      return level === "error";
    }
    return true;
  }

  private static formatMessage(message: string, data?: unknown): [string, ...unknown[]] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;
    
    if (data !== undefined) {
      return [prefix + " " + message, data];
    }
    return [prefix + " " + message];
  }

  static log(message: string, data?: unknown): void {
    if (this.shouldLog("log")) {
      const formatted = this.formatMessage(message, data);
      console.log(...formatted);
    }
  }

  static info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      const formatted = this.formatMessage(message, data);
      console.info(...formatted);
    }
  }

  static warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      const formatted = this.formatMessage(message, data);
      console.warn(...formatted);
    }
  }

  static error(message: string, data?: unknown): void {
    if (this.shouldLog("error")) {
      const formatted = this.formatMessage(message, data);
      console.error(...formatted);
    }
  }

  static debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      const formatted = this.formatMessage(message, data);
      console.debug(...formatted);
    }
  }
}

export { Logger };