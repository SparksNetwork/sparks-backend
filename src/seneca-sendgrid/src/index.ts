import {omit} from 'ramda'

import test from 'ava'
import * as assert from 'assert'
import {spy, stub} from 'sinon'
import {stubs, SenecaWithPlugin} from '../../testUtil'

/*
previous draft was treating individual functions as units
but they were never used in isolation, so the specs became tautological
Tdd'd towards the actual 'unit', which is not the individual actions
but the plugin and the external api (the sendTemplate action)
*/

const PluginOptions = () => ({
  sendgridKey: Symbol(),
})

const PluginArgs = () => {
  const {emptyRequest, API} = stubs('emptyRequest', 'API')
  return {
    SendGrid: stub().returns({emptyRequest, API}),
    emptyRequest,
    API,
  }
}

// have to test this outside seneca because i couldnt find a way to catch failing 
test('plugin will fail to initialize if no sendgridKey is passed', async function(t) {
  t.throws(() => plugin(PluginArgs())(omit(['sendgridKey'],PluginOptions())))
})

const sendTemplateArgs = () => ({
  role: 'sendgrid',
  cmd: 'sendTemplate',
  templateId: Symbol(),
  subject: Symbol(),
  recipient: Symbol(),
  sender: Symbol(),
  substitutions: {
    test: Symbol(),
  },
})

// this does not test that it was an actual assertion error
// another error could cause this to fail and still pass
const testRequiredArgs = (handler, args, requiredArg) =>
  test("${handler} requires ${requiredArg} or throws an error", async function(t) {
    const seneca = await SenecaWithPlugin(plugin(PluginArgs()), PluginOptions())
    t.throws(seneca.act(omit([requiredArg], args)))
    // why this no work
    // t.throws(seneca.act(omit([requiredArg], args)), assert.AssertionError)
  })

for (let requiredArg of ['templateId', 'subject', 'recipient', 'sender']) {
  testRequiredArgs('sendTemplate', sendTemplateArgs(), requiredArg)
}

test('sendTemplate calls SendGrid.API w properly formed SendGrid.emptyRequest from SendGrid(api key)', async function(t) {
  const pargs = PluginArgs()
  const popts = PluginOptions()
  const margs = sendTemplateArgs()
  const seneca = await SenecaWithPlugin(plugin(pargs), popts)
  await seneca.act(margs)

  t.deepEqual(pargs.SendGrid.firstCall.args, [popts.sendgridKey], 'SendGrid not initialized with proper key')
  t.deepEqual(pargs.emptyRequest.firstCall.args, [{
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      template_id: margs.templateId,
      personalizations: [
        {
          to: [
            {
              email: margs.recipient,
            }
          ],
          subject: margs.subject,
          substitutions: margs.substitutions
        }
      ],
      from: {
        email: margs.sender,
      },
    }    
  }], 'SendGrid request not built with proper args')
  t.deepEqual(pargs.API.firstCall.args, [pargs.emptyRequest()], 'SendGrid API not called with built request')
})

export function plugin({SendGrid}) {
  return function({sendgridKey}) {
    const seneca = this

    assert(sendgridKey, 'sendgrid plugin needs sendgridKey option to initialize')

    seneca.add({init: 'sendgrid'}, init({seneca, SendGrid, sendgridKey}))

    return 'sendgrid'
  }
}

function init({seneca, SendGrid, sendgridKey}) {
  return async function(args) {
    const {emptyRequest, API} = SendGrid(sendgridKey)

    seneca.add({role: 'sendgrid', cmd: 'sendTemplate'}, sendTemplate({seneca}))
    seneca.add({role: 'sendgrid', cmd: 'buildTemplateBody'}, buildTemplateBody())
    seneca.add({role: 'sendgrid', cmd: 'makeRequest'}, makeRequest({emptyRequest, API}))
  }
}

/**
 * Send an email built from a specified template ID
 *
 * @param {string} args.templateId The ID of the template in SendGrid
 * @param {string} args.subject The subject line of the email to send
 * @param {string} args.recipient An address you want to deliver the email to
 * @param {string} args.sender The email address you want the email to come from
 * @param {Object} args.substitutions A key-value object, will be passed as substitutions to make to the template in SendGrid.
 */
function sendTemplate({seneca}) {
  return async function({templateId, subject, recipient, sender, substitutions}) {
    assert(templateId, 'Must specify templateId to sendTemplate')
    assert(subject, 'Must specify subject to sendTemplate')
    assert(recipient, 'Must specify recipient to sendTemplate')
    assert(sender, 'Must specify sender to sendTemplate')
    const body = await seneca.act({
      role: 'sendgrid',
      cmd: 'buildTemplateBody',
      templateId,
      subject,
      recipient,
      sender,
      substitutions,
    })
    const result = await seneca.act({
      role: 'sendgrid',
      cmd: 'makeRequest',
      body,
    })
    return result
  }
}

function buildTemplateBody() {
  return async function({templateId, subject, recipient, sender, substitutions}) {
    return {
      template_id: templateId,
      personalizations: [
        {
          to: [
            {
              email: recipient,
            }
          ],
          subject,
          substitutions,
        }
      ],
      from: {
        email: sender,
      },
    }
  }
}

function makeRequest({emptyRequest, API}) {
  return async function({body}) {
    const request = emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body,
    })
    return API(request)
  }
}
