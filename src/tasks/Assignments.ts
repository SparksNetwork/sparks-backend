import {propEq, merge} from 'ramda'
import defaults from './defaults'

function Assignments() {
  const seneca = this
  const get = spec => this.act('role:Firebase,cmd:get', spec)

  async function updateEngagement(key, by) {
    return await seneca.act({role:'Engagements',cmd:'updateAssignmentCount', key, by})
  }

  async function updateAssignmentStatus(engagementKey) {
    const {assignments, commitments} = await get({
      engagement: engagementKey,
      assignments: {engagementKey},
      commitments: {oppKey: ['engagement', 'oppKey']},
    })

    const shiftCommit = commitments.find(propEq('code', 'shifts')) || {count: 0}
    const requiredAssignments = parseInt(shiftCommit.count, 10) || 0
    const isAssigned = assignments.length >= requiredAssignments

    return await seneca.act('role:Firebase,model:Engagements,cmd:update',
      {key: engagementKey, values: {isAssigned}})
  }

  async function updateShiftCounts(key) {
    return await seneca.act('role:Shifts,cmd:updateCounts', {key})
  }

  async function createShiftChange(msg, response) {
    const {uid} = msg
    let assignment, shift

    if (msg.cmd === 'remove') {
      ({assignment} = msg);
      ({shift} = assignment && await get({shift: assignment.shiftKey}));
    } else {
      ({assignment, shift} = await get({
        assignment: response.key,
        shift: ['assignment', 'shiftKey']
      }))
    }

    await seneca.act('role:ShiftChanges,cmd:create', {
      action: msg.cmd,
      assignment,
      shift,
      uid,
    })
  }

  this.wrap('role:Assignments,cmd:remove', async function(msg) {
    const {assignment} = msg
    const response = await this.prior(msg)

    if (response.key && assignment) {
      await updateAssignmentStatus(assignment.engagementKey)
      await updateShiftCounts(assignment.shiftKey)
      await updateEngagement(assignment.engagementKey, -1)
    }

    return response
  })

  this.wrap('role:Assignments,cmd:create', async function(msg) {
    const response = await this.prior(msg)
    await this.act('role:Shifts,cmd:updateCounts', {key: msg.values.shiftKey})
    return response
  })

  /*
   * Update engagement assignment count
   */
  this.wrap('role:Assignments,cmd:create', async function(msg) {
    const {values: {engagementKey}} = msg
    const response = await this.prior(msg)

    if (response.key) {
      await updateEngagement(engagementKey, 1)
    }

    return response
  })

  this.wrap('role:Assignments,cmd:*', async function(msg) {
    const nextMsg = msg.key ? merge(msg, await get({assignment: msg.key})) : msg
    const response = await this.prior(nextMsg)

    if (response.key) {
      await createShiftChange(nextMsg, response)
    }

    return response
  })

  return {
    name: 'Assignments',
  }
}

export default defaults(Assignments, 'create', 'update', 'remove')
