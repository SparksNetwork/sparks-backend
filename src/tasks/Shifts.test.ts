import tape from '../test/tape-seneca'
import {spy, match} from 'sinon'
import Shifts from './Shifts'

const test = tape('Shifts', [Shifts])

test('remove', async function(t) {
  const uid = 'abc123'

  // Check env
  const {shift: originalShift, assignments: originalAssignments} =
    await this.act('role:Firebase,cmd:get', {shift: 'shiftOne', assignments: {shiftKey: 'shiftOne'}})
  t.ok(originalShift)
  t.equals(originalAssignments.length, 1)

  const createShiftChangeSpy = spy()
  this.add('role:ShiftChanges,cmd:create', createShiftChangeSpy)

  // Action
  await this.act('role:Shifts,cmd:remove,key:shiftOne', {uid})

  // Spec
  const {shift, assignments} =
    await this.act('role:Firebase,cmd:get', {shift: 'shiftOne', assignments: {shiftKey: 'shiftOne'}})

  t.notOk(shift, 'Shift should be deleted')
  t.equals(assignments.length, 0, 'Shift\'s assignments should be deleted')

  t.equals(createShiftChangeSpy.callCount, 1, 'shift change is created for the assignment')
  t.ok(createShiftChangeSpy.calledWithMatch(match({
    shift: originalShift,
    assignment: originalAssignments[0],
    uid,
  })), 'shift change is given the shift, assignment and uid')
})

test('create', async function(t) {
  const {key} = await this.act('role:Shifts,cmd:create', {
    values: {name: 'my shift'},
    profile: {$key: 'profile key'}
  })

  const {shift} = await this.act('role:Firebase,cmd:get', {shift: key})

  t.ok(shift)
  t.equal(shift.ownerProfileKey, 'profile key')
  t.equal(shift.name, 'my shift')
})

test('update updates counts', async function(t) {
  const updateCountSpy = spy()
  this.add('role:Shifts,cmd:updateCounts', updateCountSpy)

  const {key} = await this.act('role:Shifts,cmd:update,key:shiftOne', {values: {}})

  t.equals(updateCountSpy.callCount, 1)
  t.ok(updateCountSpy.calledWithMatch(match({key})))
})
