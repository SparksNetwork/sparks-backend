import * as test from 'tape-async'
import {spy, stub} from 'sinon'
import {stubs, SenecaWithPlugin} from '../../testUtil'

import {omit} from 'ramda'
import * as assert from 'assert'

import {plugin} from './index'
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

const testRequiredArgs = (handler, args, requiredArg) =>
  test(`${handler} requires ${requiredArg} or throws an error`, async function(t) {
    t.plan(1)
    const seneca = await SenecaWithPlugin(plugin(PluginArgs()), PluginOptions())
    try { await seneca.act(omit([requiredArg], args)) }
    catch (err) {
      t.equal(err.name, 'AssertionError')
    }
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