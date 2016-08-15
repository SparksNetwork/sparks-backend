import * as Seneca from 'seneca-await'
import test from 'ava'
import plugin from '../index'

const seneca = Seneca()

test('can send test email', async function(t) {
	seneca.use(plugin, {
		sendgridKey: process.env.SENDGRID_KEY,
	})
	const result = await seneca.act({
		role: 'sendgrid',
		cmd: 'sendTemplate',
		templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
		subject: 'Test email',
		recipient: 'sdebaun@sparks.network',
		sender: 'help@sparks.network',
		substitutions: {
			test: '1234',
		},
	})
	t.truthy(result)
})

// test.only('fails if no subject is passed', async function(t) {
// 	seneca.use(plugin, {
// 		sendgridKey: process.env.SENDGRID_KEY,
// 	})
// 	const result = await seneca.act({
// 		role: 'sendgrid',
// 		cmd: 'sendTemplate',
// 		templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
// 		recipient: 'sdebaun@sparks.network',
// 		sender: 'help@sparks.network',
// 		substitutions: {
// 			test: '1234',
// 		},
// 	})
// 	t.falsy(result)
// })