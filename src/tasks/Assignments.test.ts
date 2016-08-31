import tape from '../test/tape-seneca'
import {spy, match} from 'sinon'
import Assignments from './Assignments'

function mockShifts() {
  this.add('role:Shifts,cmd:updateCounts', async function() {
    return {}
  })

  this.add('role:Engagements,cmd:updateAssignmentCount', async function() {
    return {}
  })

  this.add('role:ShiftChanges,cmd:create', async () => ({}))
}

const test = tape('Assignments', [mockShifts, Assignments])

test('create', async function(t) {
  const values = {
    oppKey: 'testOpp',
    engagementKey: 'testEngagement',
    teamKey: 'testTeam',
    shiftKey: 'shiftOne',
  }
  const response = await this.act('role:Assignments,cmd:create', {values})
  t.ok(response.key, 'it returns the key')
})

test('update', async function(t) {
  const values = {
    oppKey: 'testOpp',
    engagementKey: 'testEngagement',
    teamKey: 'testTeam',
    shiftKey: 'shiftOne',
  }
  const {key} = await this.act('role:Assignments,cmd:create', {values})
  const response = await this.act('role:Assignments,cmd:update', {key, values: {newValue: true}})
  t.ok(response.key)

  const {assignment} = await this.act('role:Firebase,cmd:get', {assignment: key})
  t.ok(assignment.newValue, 'it sets the new value')
})

test('shift changes', async function(t) {
  const uid = 'abc123'
  const shiftChangeSpy = spy()
  this.add('role:ShiftChanges,cmd:create', shiftChangeSpy)

  const {key} = await this.act('role:Assignments,cmd:create', {uid, values: {
    oppKey: 'testOpp',
    engagementKey: 'testEngagement',
    teamKey: 'testTeam',
    shiftKey: 'shiftOne',
  }})

  await this.act('role:Assignments,cmd:update', {uid, key, values: {shiftKey: 'shiftTwo'}})
  await this.act('role:Assignments,cmd:remove', {uid, key})

  t.equals(shiftChangeSpy.callCount, 3)

  const [args1, args2, args3] = shiftChangeSpy.getCalls().map(call => call.args[0])

  t.equals(args1.assignment.shiftKey, 'shiftOne', 'Sets assignment')
  t.equals(args1.shift.$key, 'shiftOne', 'Sets shift')
  t.equals(args1.action, 'create', 'Sets action')
  t.equals(args1.uid, uid, 'Sets uid')

  t.equals(args2.assignment.shiftKey, 'shiftTwo', 'Sets update assignment')
  t.equals(args2.shift.$key, 'shiftTwo', 'Sets update shift')
  t.equals(args2.action, 'update', 'Sets action')

  t.equals(args3.assignment.shiftKey, 'shiftTwo', 'Sets remove assignment')
  t.equals(args3.shift.$key, 'shiftTwo', 'Sets remove shift')
  t.equals(args3.action, 'remove', 'Sets action')
})
