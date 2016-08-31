import tape from '../test/tape-seneca'
import Shifts from './Shifts'

const test = tape('Shifts', [Shifts])

test('remove', async function(t) {
  let shift, assignments

  // Check env
  ({shift, assignments} =
    await this.act('role:Firebase,cmd:get', {shift: 'shiftOne', assignments: {shiftKey: 'shiftOne'}}))
  t.ok(shift)
  t.equals(assignments.length, 1)

  // Action
  await this.act('role:Shifts,cmd:remove,key:shiftOne');

  // Spec
  ({shift, assignments} =
    await this.act('role:Firebase,cmd:get', {shift: 'shiftOne', assignments: {shiftKey: 'shiftOne'}}))

  t.notOk(shift, 'Shift should be deleted')
  t.equals(assignments.length, 0, 'Shift\'s assignments should be deleted')
})
