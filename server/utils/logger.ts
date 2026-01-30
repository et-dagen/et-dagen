/**
 * Wide-event structured logging utility
 *
 * Implements the principles from https://loggingsucks.com/
 * - One comprehensive log event per request per service
 * - High cardinality fields for powerful querying
 * - Structured JSON output for easy parsing
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log importance determines the minimum log level for a request to be logged.
 * - 'debug': Low importance (image fetches, static data reads) - only logged when LOG_LEVEL=debug
 * - 'info': Normal importance (standard API calls) - logged at info level and above
 * - 'warn': High importance (mutations, auth events) - always logged at warn+ in production
 * - 'error': Critical - always logged
 *
 * Note: Errors and slow requests are ALWAYS logged regardless of importance setting.
 */
export type LogImportance = 'debug' | 'info' | 'warn' | 'error'

export interface WideEvent {
  // Core identifiers
  timestamp: string
  request_id: string
  trace_id?: string

  // Service info
  service: string
  version: string
  environment: string
  region?: string

  // Request details
  method: string
  path: string
  query?: Record<string, unknown>
  status_code?: number
  duration_ms?: number

  // User context (added by middleware)
  user?: {
    uid: string
    email?: string
    name?: string
    access_level?: string
    study_program?: string
    current_year?: number
  }

  // Auth context
  auth?: {
    authenticated: boolean
    token_valid?: boolean
    auth_method?: 'bearer' | 'cookie'
  }

  // Business context (added by handlers)
  resource?: {
    type: string
    id?: string
    action: string
    description?: string // Human-readable description of what this endpoint does
  }

  // Database operations
  db?: {
    queries: number
    reads: number
    writes: number
    operations?: Array<{
      type: 'read' | 'write' | 'delete'
      ref: string
      duration_ms?: number
    }>
  }

  // Error details
  error?: {
    type: string
    code: string
    message: string
    stack?: string
    retriable?: boolean
  }

  // Outcome
  outcome: 'success' | 'error' | 'client_error'

  // Log importance - determines if this request should be logged based on log level
  _importance?: LogImportance

  // Custom fields for business-specific data
  [key: string]: unknown
}

// Generate a unique request ID
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `req_${timestamp}_${randomPart}`
}

// Get log level from environment or default to 'info'
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase()
  if (
    level === 'debug' ||
    level === 'info' ||
    level === 'warn' ||
    level === 'error'
  ) {
    return level
  }
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info'
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel, importance?: LogImportance): boolean {
  const currentLevel = getLogLevel()

  // If importance is set, check if current log level allows this importance
  // e.g., if importance is 'debug' but LOG_LEVEL is 'info', skip it
  if (
    importance &&
    LOG_LEVEL_PRIORITY[importance] < LOG_LEVEL_PRIORITY[currentLevel]
  ) {
    return false
  }

  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel]
}

// Tail sampling decision - always keep errors and slow requests
function shouldSample(event: WideEvent): boolean {
  // Always keep errors
  if (event.outcome === 'error') return true
  if (event.status_code && event.status_code >= 500) return true
  if (event.error) return true

  // Always keep slow requests (above 2000ms threshold)
  if (event.duration_ms && event.duration_ms > 2000) return true

  // Always keep admin users for audit purposes
  if (event.user?.access_level === 'admin') return true

  // In development, log everything
  if (process.env.NODE_ENV === 'development') return true

  // Sample rate for successful requests (default 100% in dev, configurable in prod)
  const sampleRate = parseFloat(process.env.LOG_SAMPLE_RATE ?? '1.0')
  return Math.random() < sampleRate
}

// Sanitize sensitive data from logs
function sanitizeEvent(event: WideEvent): WideEvent {
  const sanitized = { ...event }

  // Remove any potential sensitive fields
  if (sanitized.user) {
    sanitized.user = { ...sanitized.user }
    // Email is kept for debugging but could be masked in production
  }

  // Remove stack traces in production unless it's a server error
  if (process.env.NODE_ENV === 'production' && sanitized.error?.stack) {
    if (sanitized.status_code && sanitized.status_code < 500) {
      delete sanitized.error.stack
    }
  }

  return sanitized
}

// Main logging function
export function logWideEvent(event: WideEvent, level: LogLevel = 'info'): void {
  if (!shouldLog(level, event._importance)) return
  if (!shouldSample(event)) return

  const sanitized = sanitizeEvent(event)
  const logEntry = {
    level,
    ...sanitized,
  }

  // Output as JSON for structured log aggregation
  const output = JSON.stringify(logEntry)

  switch (level) {
    case 'debug':
      console.debug(output)
      break
    case 'info':
      console.info(output)
      break
    case 'warn':
      console.warn(output)
      break
    case 'error':
      console.error(output)
      break
  }
}

// Helper to create a partial wide event that can be enriched
export function createWideEvent(
  requestId: string,
  method: string,
  path: string,
): WideEvent {
  return {
    timestamp: new Date().toISOString(),
    request_id: requestId,
    service: process.env.SERVICE_NAME ?? 'et-dagen-api',
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    method,
    path,
    outcome: 'success',
    db: {
      queries: 0,
      reads: 0,
      writes: 0,
      operations: [],
    },
  }
}

// Helper to determine outcome from status code
export function determineOutcome(
  statusCode: number,
): 'success' | 'error' | 'client_error' {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'client_error'
  return 'success'
}
