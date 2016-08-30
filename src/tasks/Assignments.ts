import {propEq} from 'ramda'
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

  this.wrap('role:Assignments,cmd:remove', async function(msg) {
    const {assignment} = await get({assignment:msg.key})
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

  return {
    name: 'Assignments',
  }
}

export default defaults(Assignments, 'create', 'update', 'remove')
