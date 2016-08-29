import * as test from 'tape-async'
// import test from 'ava'
import * as assert from 'assert'
import {spy, stub} from 'sinon'
import {stubs, SenecaWithPlugin} from '../../../testUtil'

import {plugin} from './index'

test('Engagement/create', async function(t) {
  const seneca = await SenecaWithPlugin(plugin, {domain: 'http://sparks.network'})
  t.plan(13)
  // should generate a client token
  seneca.add({role: 'gateway', cmd: 'generateClientToken'}, async function(args) {
    t.ok(true)
    return {clientToken: 'CLIENT_TOKEN'}
  })
  // should push a new engagement to firebase
  seneca.add({role: 'Firebase', cmd: 'push'}, function({model, values}) {
    t.is(model, 'Engagements')
    t.deepEqual(values, {
      oppKey: 'OPP_KEY',
      profileKey: 'PROFILE_KEY',
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
      paymentClientToken: 'CLIENT_TOKEN',
    })
    return {
      key: 'ENGAGEMENT_KEY',
    }
  })
  // should get info about engagement & related records
  seneca.add({role: 'Firebase', cmd: 'get'}, async function({engagement, profile, opp, project}) {
    t.is(engagement, 'ENGAGEMENT_KEY')
    t.deepEqual(profile, ['engagement', 'profileKey'])
    t.deepEqual(opp, ['engagement', 'oppKey'])
    t.deepEqual(project, ['opp', 'projectKey'])
    return {
      engagement: {
        profileKey: 'PROFILE_KEY',
        oppKey: 'OPP_KEY',
      },
      profile: {
        fullName: 'PROFILE_FULLNAME',
        email: 'PROFILE_EMAIL',
      },
      opp: {
        name: 'OPP_NAME',
      },
      project: {
        name: 'PROJECT_NAME',
      }
    }
  })
  // should send an email
  seneca.add({role: 'sendgrid', cmd: 'sendTemplate'}, async function(args) {
    t.is(args.templateId, '96e36ab7-43b0-4d45-8309-32c52530bd8a')
    t.is(args.subject, 'Sit Tight! PROJECT_NAME has your application.')
    t.is(args.recipient, 'PROFILE_EMAIL')
    t.is(args.sender, 'help@sparks.network')
    t.deepEqual(args.substitutions, {
      '-username-': 'PROFILE_FULLNAME',
      '-opp_name-': 'OPP_NAME',
      '-project_name-': 'PROJECT_NAME',
      '-engagementurl-': 'http://sparks.network/engaged/ENGAGEMENT_KEY/',
    })
  })
  const {key} = await seneca.act({
    role: 'Engagements',
    cmd: 'create',
    oppKey: 'OPP_KEY',
    profileKey: 'PROFILE_KEY',
  })
  // should return the newly created engagement key
  t.is(key, 'ENGAGEMENT_KEY')
})

test('Engagement/remove', async function(t) {
  const seneca = await SenecaWithPlugin(plugin, {domain: 'http://sparks.network'})
  t.plan(8)
  // should get assignments for the engagement
  seneca.add({role: 'Firebase', cmd: 'get'}, async function({assignments}) {
    t.deepEqual(assignments, {engagementKey: 'ENGAGEMENT_KEY'})
    return {
      assignments: [
        {
          $key: 'ASSIGNMENT_KEY_1',
          shiftKey: 'SHIFT_KEY_1',
        },
        {
          $key: 'ASSIGNMENT_KEY_2',
          shiftKey: 'SHIFT_KEY_1',
        },
        {
          $key: 'ASSIGNMENT_KEY_3',
          shiftKey: 'SHIFT_KEY_2',
        }
      ],
    }
  })
  // should issue a remove for each assignment
  seneca.add({role: 'Firebase', cmd: 'remove', model: 'Assignments'}, async function({key}) {
    t.ok(['ASSIGNMENT_KEY_1', 'ASSIGNMENT_KEY_2', 'ASSIGNMENT_KEY_3'].indexOf(key) >= 0)
    return {key}
  })
  // should issue a count refresh for each shift affected, but only once
  seneca.add({role: 'Shifts', cmd: 'updateCounts'}, async function({key}) {
    t.ok(['SHIFT_KEY_1', 'SHIFT_KEY_2'].indexOf(key) >= 0)
  })
  // should issue a firebase remove for the engagement
  seneca.add({role: 'Firebase', cmd: 'remove', model: 'Engagements'}, async function({key}) {
    t.is(key, 'ENGAGEMENT_KEY')
    return {key}
  })
  const {key} = await seneca.act({
    role: 'Engagements',
    cmd: 'remove',
    key: 'ENGAGEMENT_KEY',
  })
  // should return the deleted key
  t.is(key, 'ENGAGEMENT_KEY')
})
