/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// @flow

import { observable, action } from 'mobx'

import ProviderSource from '../sources/ProviderSource'
import { providersWithExtraOptions } from '../config.js'
import type { DestinationOption } from '../types/Endpoint'
import type { Field } from '../types/Field'
import type { Providers } from '../types/Providers'

class ProviderStore {
  @observable connectionInfoSchema: Field[] = []
  @observable connectionSchemaLoading: boolean = false
  @observable providers: ?Providers
  @observable providersLoading: boolean = false
  @observable optionsSchema: Field[] = []
  @observable optionsSchemaLoading: boolean = false
  @observable destinationOptions: DestinationOption[] = []
  @observable destinationOptionsLoading: boolean = false

  lastOptionsSchemaType: string = ''

  @action getConnectionInfoSchema(providerName: string): Promise<void> {
    this.connectionSchemaLoading = true

    return ProviderSource.getConnectionInfoSchema(providerName).then((fields: Field[]) => {
      this.connectionSchemaLoading = false
      this.connectionInfoSchema = fields
    }).catch(() => {
      this.connectionSchemaLoading = false
    })
  }

  @action clearConnectionInfoSchema() {
    this.connectionInfoSchema = []
  }

  @action loadProviders(): Promise<void> {
    this.providers = null
    this.providersLoading = true

    return ProviderSource.loadProviders().then((providers: Providers) => {
      this.providers = providers
      this.providersLoading = false
    }).catch(() => {
      this.providersLoading = false
    })
  }

  @action loadOptionsSchema(providerName: string, schemaType: string): Promise<void> {
    this.optionsSchemaLoading = true
    this.lastOptionsSchemaType = schemaType

    return ProviderSource.loadOptionsSchema(providerName, schemaType).then((fields: Field[]) => {
      this.optionsSchemaLoading = false
      this.optionsSchema = fields
    }).catch(() => {
      this.optionsSchemaLoading = false
    })
  }

  @action getDestinationOptions(endpointId: string, provider: string, envData?: { [string]: mixed }): Promise<void> {
    let providerWithExtraOptions = providersWithExtraOptions.find(p => typeof p === 'string' ? p === provider : p.name === provider)
    if (!providerWithExtraOptions) {
      return Promise.resolve()
    }

    this.destinationOptionsLoading = true
    return ProviderSource.getDestinationOptions(endpointId, envData).then(options => {
      this.optionsSchema.forEach(field => {
        let fieldValues = options.find(f => f.name === field.name)
        if (fieldValues) {
          if (field.type === 'string') {
            // $FlowIgnore
            field.enum = [...fieldValues.values]
            if (fieldValues.config_default) {
              field.default = typeof fieldValues.config_default === 'string' ? fieldValues.config_default : fieldValues.config_default.id
            }
            // the `migr_image_map` field is special since it needs to group the values by OS type
          } else if (field.name === 'migr_image_map') {
            field.properties = [
              {
                name: 'windows_image',
                type: 'string',
                enum: fieldValues.values.filter(v => typeof v !== 'string' && v.os_type === 'windows'),
              },
              {
                name: 'linux_image',
                type: 'string',
                enum: fieldValues.values.filter(v => typeof v !== 'string' && v.os_type === 'linux'),
              },
            ]
          }
        }
      })
      this.destinationOptions = options
      this.destinationOptionsLoading = false
    }).catch(() => {
      if (envData) {
        return this.loadOptionsSchema(provider, this.lastOptionsSchemaType).then(() => {
          return this.getDestinationOptions(endpointId, provider)
        })
      }
      return this.loadOptionsSchema(provider, this.lastOptionsSchemaType)
    }).then(() => {
      this.destinationOptions = []
      this.destinationOptionsLoading = false
    })
  }
}

export default new ProviderStore()
