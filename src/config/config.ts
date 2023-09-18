import { ConfigurationError } from './ConfigurationError'

export type ConfigValue = string | number | boolean

type ConfigMap = { [key: string]: ConfigValue | undefined }

type ValidatedConfigMap = { [key: string]: ConfigValue }

export class Config {
  loaded = false

  configValues: ValidatedConfigMap = {}

  load<T extends ConfigMap>(configValues: T) {
    if (this.loaded) {
      throw new ConfigurationError('Cannot call load() more than once')
    }

    this.configValues = this.validate(configValues)
    this.loaded = true

    return <K extends keyof T>(key: K) => {
      return configValues[key]
    }
  }

  validate(configValues: ConfigMap): ValidatedConfigMap {
    Object.keys(configValues).forEach((key) => {
      if (configValues[key] === undefined) {
        throw new ConfigurationError(
          `Undefined config value "${key}", ensure it exists`
        )
      }
    })
    return configValues as ValidatedConfigMap
  }

  get(key: string): ConfigValue {
    return this.configValues[key] as ConfigValue
  }
}

export const config = new Config()
