/**
 * Sentry Configuration for Error Tracking & Monitoring
 * Captures unhandled exceptions, errors, and performance metrics
 * Dashboard: https://sentry.io/organizations/sawaikars/
 */

const Sentry = require('@sentry/node');

// Optional profiling integration (requires @sentry/profiling-node)
let nodeProfilingIntegration = null;
try {
  const { nodeProfilingIntegration: profiling } = require('@sentry/profiling-node');
  nodeProfilingIntegration = profiling;
} catch (e) {
  // Profiling integration not available, will skip
}

/**
 * Initialize Sentry with production settings
 * Captures errors, performance data, and user sessions
 */
const initializeSentry = (app) => {
  // Only initialize in production with SENTRY_DSN configured
  if (process.env.NODE_ENV === 'production' && !process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  // Skip Sentry in development to avoid compatibility issues
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚙️  Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    // Unique identifier for your Sentry project
    dsn: process.env.SENTRY_DSN,

    // Environment (development, staging, production)
    environment: process.env.NODE_ENV || 'development',

    // Application version for release tracking
    release: process.env.APP_VERSION || '2.0.0',

    // Performance monitoring - capture 100% of transactions in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profile sampling - 10% of performance monitoring data
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enable debug mode in development
    debug: process.env.NODE_ENV !== 'production',

    // Integrations for enhanced error context
    integrations: [
      // HTTP calls
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Express.js integration - simplified to avoid tracing issues
      new Sentry.Integrations.Express({
        app: true,
        request: false,
        transaction: false
      }),

      // Node.js profiling for performance analysis (optional)
      ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),

      // Unhandled rejection tracking
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUncaughtException({
        exitEvenIfOtherHandlersAreRegistered: true
      })
    ],

    // Allowed URLs for error reporting
    allowUrls: [
      'https://sawaikars.com',
      'https://api.sawaikars.com',
      'http://localhost'
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors that are expected
      'Network error',
      'NetworkError',
      'timeout of',
      'Network request failed',
      // Cancel errors
      'cancelled'
    ],

    // Attach database query context
    attachStacktrace: true,

    // Server name for organizing errors
    serverName: process.env.SERVER_NAME || 'cashew-store-backend',

    // Extra context sent with every event
    initialScope: {
      tags: {
        component: 'api',
        service: 'cashew-store'
      }
    }
  });

  // Attach Sentry to Express app
  // This should be the first middleware!
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  console.log('✅ Sentry initialized for error tracking');
};

/**
 * Error handler middleware - catches all Express errors
 * Should be added AFTER all other middleware
 */
const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Capture exception with context
 * Usage: captureException(error, { userId, action, metadata })
 */
const captureException = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Add custom context
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.action) scope.setContext('action', { name: context.action });
    if (context.metadata) scope.setContext('metadata', context.metadata);

    // Add tags for filtering
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set level (fatal, error, warning, info, debug)
    if (context.level) scope.setLevel(context.level);

    // Capture the error
    Sentry.captureException(error);
  });
};

/**
 * Capture message (for non-error events)
 * Usage: captureMessage('User signed in', 'info', { userId })
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Add custom context
    if (context.userId) scope.setUser({ id: context.userId });
    Object.entries(context).forEach(([key, value]) => {
      if (key !== 'userId') {
        scope.setContext(key, { value });
      }
    });

    // Capture message
    Sentry.captureMessage(message, level);
  });
};

/**
 * Capture breadcrumb for event tracking
 * Breadcrumbs appear before errors for context
 * Usage: addBreadcrumb('api_call', { endpoint: '/products', method: 'GET' })
 */
const addBreadcrumb = (message, data = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    level: 'info',
    category: 'user-action',
    data,
    timestamp: Date.now() / 1000
  });
};

/**
 * Set user context for error attribution
 * Usage: setUserContext(clerkId, email, { plan: 'premium' })
 */
const setUserContext = (userId, email, metadata = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email: email,
    ...metadata
  });
};

/**
 * Clear user context (when logging out)
 */
const clearUserContext = () => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Create transaction for performance monitoring
 * Usage: const transaction = startTransaction('create_order', { userId })
 */
const startTransaction = (name, context = {}) => {
  if (!process.env.SENTRY_DSN) return null;

  const transaction = Sentry.startTransaction({
    name,
    op: context.op || 'http.server',
    tags: context.tags || {}
  });

  return transaction;
};

/**
 * Middleware to automatically track database queries
 */
const mongooseMiddleware = (req, res, next) => {
  if (!process.env.SENTRY_DSN) return next();

  const span = Sentry.getCurrentHub().getActiveSpan();
  if (!span) return next();

  // Track mongoose operations
  const originalFind = req.db?.collection?.find;
  if (originalFind) {
    req.db.collection.find = function (...args) {
      const dbSpan = span.startChild({
        op: 'db.mongosse.find',
        description: `MongoDB find query`
      });

      const result = originalFind.apply(this, args);
      dbSpan.end();
      return result;
    };
  }

  next();
};

module.exports = {
  Sentry,
  initializeSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  startTransaction,
  mongooseMiddleware
};
