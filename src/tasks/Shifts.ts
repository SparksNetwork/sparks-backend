import defaults from './defaults'
import {merge} from 'ramda'

function Shifts() {
  this.wrap('role:Shifts,cmd:create', async function(msg) {
    return await this.prior(merge(msg, {values: merge(msg.values, {ownerProfileKey: msg.profile.$key})}))
  })

  this.wrap('role:Shifts,cmd:update', async function(msg) {
    const {key} = await this.prior(msg)
    await this.act('role:Shifts,cmd:updateCounts', {key})
    return {key}
  })

  this.add({role:'Shifts',cmd:'updateCounts'}, async function({key}) {
    const {assignments} = await this.act({role:'Firebase',cmd:'get',
      assignments: {shiftKey: key},
    })

    // TODO: use transaction?
    await this.act('role:Firebase,model:Shifts,cmd:update', {key, values: {
      assigned: assignments.length,
    }})

    return {assigned: assignments.length}
  })

  /**
   * Wrap the shifts remove to cascade delete the assignments
   */
  this.wrap('role:Shifts,cmd:remove', async function(msg) {
    const {key} = msg
    const {assignments} = await this.act('role:Firebase,cmd:get', {assignments: {shiftKey: key}})
    await Promise.all(
      assignments.map(a => this.act('role:Firebase,cmd:remove,model:Assignments', {key: a.$key}))
    )
    return await this.prior(msg)
  })
}

export default defaults(Shifts, 'create', 'update', 'remove')

