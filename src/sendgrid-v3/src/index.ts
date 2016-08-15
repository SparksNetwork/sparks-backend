import {curry} from 'ramda'

import test from 'ava'
import * as assert from 'assert'
import {spy, stub} from 'sinon'
import {stubs, testAddHandler} from '../../testUtil'

// --------------------------------------------------------------------------------
test('plugin adds init handler to seneca', async function(t) {
	const seneca = stubs('add')
	const {SendGrid, init, sendTemplate, makeRequest, buildTemplateBody, sendgridKey} =
		stubs('SendGrid', 'init', 'sendTemplate', 'makeRequest', 'buildTemplateBody', 'sendgridKey')

	await plugin({SendGrid, init, sendTemplate, makeRequest, buildTemplateBody}).call(seneca, {sendgridKey})
	testAddHandler(t, seneca, 0, {init: 'sendgrid'}, init, [{
		seneca,
		SendGrid,
		sendTemplate,
		makeRequest,
		buildTemplateBody,
		sendgridKey,
	}])
})

export function plugin({SendGrid, init, sendTemplate, makeRequest, buildTemplateBody}) {
	return function({sendgridKey}) {
		const seneca = this
		seneca.add({init: 'sendgrid'}, init({
			seneca,
			SendGrid,
			sendTemplate,
			makeRequest,
			buildTemplateBody,
			sendgridKey,
		}))
		return 'sendgrid'
	}
}

// --------------------------------------------------------------------------------
test('init handler adds rest of handlers', async function(t) {
	const seneca = stubs('add')
	const {done, sendTemplate, makeRequest, buildTemplateBody, sendgridKey} =
		stubs('done', 'sendTemplate', 'makeRequest', 'buildTemplateBody', 'sendgridKey')
	const SendGrid = stub().returns(stubs('emptyRequest', 'API'))

	await init({seneca, sendgridKey, SendGrid, sendTemplate, makeRequest, buildTemplateBody})({})

	t.is(SendGrid.args[0][0], sendgridKey)
	testAddHandler(t, seneca, 0, {role: 'sendgrid', cmd: 'sendTemplate'}, sendTemplate, [{
		seneca,
	}])
	testAddHandler(t, seneca, 1, {role: 'sendgrid', cmd: 'makeRequest'}, makeRequest, [{
		emptyRequest: SendGrid.returnValues[0].emptyRequest,
		API: SendGrid.returnValues[0].API,
	}])
	testAddHandler(t, seneca, 2, {role: 'sendgrid', cmd: 'buildTemplateBody'}, buildTemplateBody, [{}])
})

export function init({seneca, sendgridKey, SendGrid, sendTemplate, makeRequest, buildTemplateBody}) {
	return async function(args) {
		// console.log('SendGrid is ', SendGrid)
		// console.log('sendgridKey', sendgridKey)
		// const sg = require('sendgrid')(sendgridKey)
		// console.log('sg', sg)
		const {emptyRequest, API} = SendGrid(sendgridKey)
		// console.log('emptyRequest fn', emptyRequest)
		seneca.add({role: 'sendgrid', cmd: 'sendTemplate'}, sendTemplate({
			seneca,
		}))
		seneca.add({role: 'sendgrid', cmd: 'makeRequest'}, makeRequest({
			emptyRequest,
			API,
		}))
		seneca.add({role: 'sendgrid', cmd: 'buildTemplateBody'}, buildTemplateBody({}))
	}
}

// --------------------------------------------------------------------------------
test('sendTemplate handler should build body and make request', async function(t) {
	const seneca = stubs('act')
	const {templateId, subject, recipient, sender, substitutions} = stubs('templateId', 'subject', 'recipient', 'sender', 'substitutions')
	await sendTemplate({seneca})({templateId, subject, recipient, sender, substitutions})

	t.deepEqual(seneca.act.args[0][0], {role: 'sendgrid', cmd: 'buildTemplateBody', templateId, subject, recipient, sender, substitutions})
	t.deepEqual(seneca.act.args[1][0], {role: 'sendgrid', cmd: 'makeRequest', body: seneca.act.returnValues[0]})
})

export function sendTemplate({seneca}) {
	return async function({templateId, subject, recipient, sender, substitutions}) {
		const body = await seneca.act({role: 'sendgrid', cmd: 'buildTemplateBody', templateId, subject, recipient, sender, substitutions})
		return seneca.act({role: 'sendgrid', cmd: 'makeRequest', body})
	}
}

// --------------------------------------------------------------------------------
test('makeRequest handler should create and post the email', async function(t) {
	const {emptyRequest, API, body} = stubs('emptyRequest', 'API', 'body')

	await makeRequest({emptyRequest, API})({body})

	t.deepEqual(emptyRequest.firstCall.args[0], {method: 'POST', path: '/v3/mail/send', body})
	t.is(API.firstCall.args[0], emptyRequest.returnValues[0])
})

export function makeRequest({emptyRequest, API}) {
	return async function({body}) {
		const request = emptyRequest({
			method: 'POST',
			path: '/v3/mail/send',
			body,
		})
		return API(request)
	}
}

// --------------------------------------------------------------------------------
test('buildTemplateBody handler should create the structure expected by makeRequest', async function(t) {
	const args = {
		templateId: '1234',
		subject: 'This is an email',
		recipient: 'to@test.com',
		sender: 'from@test.com',
		substitutions: {
			'foo': 'bar',
			'baz': 'boz',
		}
	}

	const body = await buildTemplateBody({})(args)
	t.deepEqual(body, {
		template_id: args.templateId,
		personalizations: [
			{
				to: [
					{
						email: args.recipient,
					}
				],
				subject: args.subject,
				substitutions: args.substitutions
			}
		],
		from: {
			email: args.sender,
		},
	})
})

export function buildTemplateBody({}) {
	return async function({templateId, subject, recipient, sender, substitutions}) {
		assert(subject, 'subject is required')
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


