// Logger Utility - Structured logging for debugging and monitoring
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = __DEV__ ? LOG_LEVELS.debug : LOG_LEVELS.info;

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${metaStr}`;
  }

  debug(message, meta) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  info(message, meta) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message, meta) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message, meta) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  // Performance timing
  time(label) {
    console.time(`[${this.context}] ${label}`);
  }

  timeEnd(label) {
    console.timeEnd(`[${this.context}] ${label}`);
  }

  // Create child logger with additional context
  child(additionalContext) {
    const child = new Logger(`${this.context}:${additionalContext}`);
    return child;
  }
}

// Default logger instance
export const logger = new Logger();

// Create logger for a specific module
export function createLogger(context) {
  return new Logger(context);
}

// Log user actions for analytics
export function logAction(action, data = {}) {
  logger.info(`User Action: ${action}`, { action, ...data });
}

// Log API calls
export function logApiCall(method, url, status, duration) {
  if (status >= 400) {
    logger.warn(`API ${method} ${url} - ${status} (${duration}ms)`);
  } else {
    logger.debug(`API ${method} ${url} - ${status} (${duration}ms)`);
  }
}

// Log navigation
export function logNavigation(from, to) {
  logger.debug(`Navigation: ${from} -> ${to}`);
}

// Log errors with stack trace
export function logError(error, context = {}) {
  logger.error(error.message || String(error), {
    stack: error.stack,
    ...context,
  });
}

export default logger;