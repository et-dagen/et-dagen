/**
 * What server code imports from `nitropack/runtime`, for unit tests that run without Nitro. The
 * real module loads Nitro's app, which exists only in a build. Route meta is read at build time,
 * and plugins, tasks and error handlers are plain functions here.
 */
export const defineRouteMeta = (_meta: unknown) => {}
export const defineNitroPlugin = <T>(plugin: T) => plugin
export const defineTask = <T>(task: T) => task
export const defineNitroErrorHandler = <T>(handler: T) => handler
export const useRuntimeConfig = () => ({ public: {} }) as Record<string, any>
