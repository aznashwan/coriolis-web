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

import type { AlertInfo, NotificationItemData } from '../types/NotificationItem'
import NotificationSource from '../sources/NotificationSource'

class NotificationStore {
  @observable alerts: AlertInfo[] = []
  @observable notificationItems: NotificationItemData[] = []

  visibleErrors: string[] = []

  @action alert(message: string, level?: $PropertyType<AlertInfo, 'level'>, options?: $PropertyType<AlertInfo, 'options'>) {
    if (!this.visibleErrors.find(e => e === message)) {
      this.alerts.push({ message, level, options })

      if (level === 'error') {
        this.visibleErrors.push(message)
        setTimeout(() => { this.visibleErrors = this.visibleErrors.filter(e => e !== message) }, 10000)
      }
    }
  }

  @action async loadData() {
    let data = await NotificationSource.loadData()
    this.notificationItems = data
  }

  @action saveSeen() {
    this.notificationItems = this.notificationItems.map(item => { return { ...item, unseen: false } })
    NotificationSource.saveSeen(this.notificationItems)
  }
}

export default new NotificationStore()
