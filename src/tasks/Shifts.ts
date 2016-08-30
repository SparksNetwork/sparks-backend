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
    const {assignments} = msg
    await Promise.all(
      assignments.map(a => this.act('role:Firebase,cmd:remove,model:Assignments', {key: a.$key}))
    )
    return await this.prior(msg)
  })

  /*
   * Create a shift change when removing a shift with assignments
   */
  this.wrap('role:Shifts,cmd:remove', async function(msg) {
    const {uid, shift, assignments} = msg
    const response = await this.prior(msg)

    if (response.key) {
      await Promise.all(
        assignments.map(assignment =>
          this.act('role:ShiftChanges,cmd:create', {
            shift, assignment, uid
          })
        )
      )
    }

    return response
  })

  /*
   * Load shift and assignments when removing shift
   */
  this.wrap('role:Shifts,cmd:remove', async function(msg) {
    const {key} = msg
    const {shift, assignments} = await this.act('role:Firebase,cmd:get', {shift: key, assignments: {shiftKey: key}})
    return await this.prior(merge(msg, {shift, assignments}))
  })
}

export default defaults(Shifts, 'create', 'update', 'remove')

