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

import NotificationStore from '../stores/NotificationStore'
import ReplicaSource from '../sources/ReplicaSource'
import type { MainItem } from '../types/MainItem'
import type { Execution } from '../types/Execution'
import type { Field } from '../types/Field'

class ReplicaStoreUtils {
  static addExecutionToReplica(opts: {
    replicas: MainItem[],
    replicaDetails: ?MainItem,
    execution: Execution,
    replicaId: string,
  }) {
    let replicasToUpdate = opts.replicas.filter(r => r.id === opts.replicaId)
    if (opts.replicaDetails && opts.replicaDetails.id === opts.replicaId) {
      replicasToUpdate.push(opts.replicaDetails)
    }

    replicasToUpdate.forEach(r => {
      if (r.executions.find(e => e.id === opts.execution.id)) {
        return
      }

      if (r.executions) {
        r.executions.push(opts.execution)
      } else {
        r.executions = [opts.execution]
      }
    })
  }
}

class ReplicaStore {
  @observable replicas: MainItem[] = []
  @observable replicaDetails: ?MainItem = null
  @observable loading: boolean = true
  @observable backgroundLoading: boolean = false
  @observable detailsLoading: boolean = true

  @action getReplicas(options?: { showLoading: boolean }): Promise<MainItem[]> {
    this.backgroundLoading = true

    if ((options && options.showLoading) || this.replicas.length === 0) {
      this.loading = true
    }

    return ReplicaSource.getReplicas().then(replicas => {
      this.replicas = replicas
      this.loading = false
      this.backgroundLoading = false
    }).catch(() => {
      this.loading = false
      this.backgroundLoading = false
    })
  }

  @action getReplicaExecutions(replicaId: string): Promise<Execution[]> {
    return ReplicaSource.getReplicaExecutions(replicaId).then(executions => {
      let replica = this.replicas.find(replica => replica.id === replicaId)

      if (replica) {
        replica.executions = executions
      }

      if (this.replicaDetails && this.replicaDetails.id === replicaId) {
        this.replicaDetails = {
          ...this.replicaDetails,
          executions,
        }
      }
    })
  }

  @action getReplica(replicaId: string): Promise<MainItem> {
    this.detailsLoading = true

    return ReplicaSource.getReplica(replicaId).then(replica => {
      this.detailsLoading = false
      this.replicaDetails = replica
    }).catch(() => {
      this.detailsLoading = false
    })
  }

  @action execute(replicaId: string, fields?: Field[]): Promise<void> {
    return ReplicaSource.execute(replicaId, fields).then(execution => {
      ReplicaStoreUtils.addExecutionToReplica({
        replicaId,
        replicas: this.replicas,
        replicaDetails: this.replicaDetails,
        execution,
      })
    })
  }

  @action cancelExecution(replicaId: string, executionId: string): Promise<void> {
    return ReplicaSource.cancelExecution(replicaId, executionId).then(() => {
      NotificationStore.notify('Cancelled', 'success')
    })
  }

  @action deleteExecution(replicaId: string, executionId: string): Promise<void> {
    return ReplicaSource.deleteExecution(replicaId, executionId).then(() => {
      let executions = []

      if (this.replicaDetails && this.replicaDetails.id === replicaId) {
        if (this.replicaDetails.executions) {
          executions = [...this.replicaDetails.executions.filter(e => e.id !== executionId)]
        }

        this.replicaDetails = {
          ...this.replicaDetails,
          executions,
        }
      }
    })
  }

  @action delete(replicaId: string) {
    return ReplicaSource.delete(replicaId).then(() => {
      this.replicas = this.replicas.filter(r => r.id !== replicaId)
    })
  }

  @action deleteDisks(replicaId: string) {
    return ReplicaSource.deleteDisks(replicaId).then(execution => {
      ReplicaStoreUtils.addExecutionToReplica({
        replicaId,
        replicas: this.replicas,
        replicaDetails: this.replicaDetails,
        execution,
      })
    })
  }

  @action clearDetails() {
    this.detailsLoading = true
    this.replicaDetails = null
  }
}

export default new ReplicaStore()
