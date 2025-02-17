import { KEVIN_ARGUMENTS } from './kevin_arguments.ts'

export default {
  debug: (
    message: string,
    ...optionalParams: unknown[]
  ): void => {
    if (KEVIN_ARGUMENTS.isQuiet || !KEVIN_ARGUMENTS.isDebug) {
      return
    }
    console.debug(message, optionalParams)
  },
  info: (
    message: string,
    ...optionalParams: unknown[]
  ): void => {
    if (KEVIN_ARGUMENTS.isQuiet) {
      return
    }
    console.info(message, optionalParams)
  },
  warn: (
    message: string,
    ...optionalParams: unknown[]
  ): void => {
    if (KEVIN_ARGUMENTS.isQuiet) {
      return
    }
    console.warn(message, optionalParams)
  },
  error: (
    message: string,
    ...optionalParams: unknown[]
  ): void => {
    if (KEVIN_ARGUMENTS.isQuiet) {
      return
    }
    console.error(message, optionalParams)
  },
}
