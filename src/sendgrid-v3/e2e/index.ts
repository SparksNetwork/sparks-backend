import * as Seneca from 'seneca-await'
import test from 'ava'
import plugin from '../index'

import * as mailosaur from 'mailosaur'

const seneca = Seneca()

const Mailosaur = mailosaur(process.env.MAILOSAUR_API_KEY)
const mailbox = new Mailosaur.Mailbox(process.env.MAILOSAUR_MAILBOX_ID)
const RECIPIENT_EMAIL = mailbox.generateEmailAddress()

test('can send test email', async function(t) {
	seneca.use(plugin, {
		sendgridKey: process.env.SENDGRID_KEY,
	})
	console.log('sending to ', RECIPIENT_EMAIL)
	const result = await seneca.act({
		role: 'sendgrid',
		cmd: 'sendTemplate',
		templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
		subject: 'Test email',
		recipient: RECIPIENT_EMAIL,
		sender: 'help@sparks.network',
		substitutions: {
			test: '1234',
		},
	})
	t.truthy(result)
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			mailbox.getEmailsByRecipient(RECIPIENT_EMAIL, (err, emails) => {
				if (err) { return reject(err) }
				else {
					t.is(emails.length, 1, 'Should see one email in the inbox')
					mailbox.deleteAllEmail()
					return resolve(emails)
				}
			})
		}, 3000)
	})
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