import * as Seneca from 'seneca-await'
import * as test from 'tape-async'
import plugin from '../index'
import * as sleep from 'sleep-promise'

import * as mailosaur from 'mailosaur'

const seneca = Seneca()

const Mailosaur = mailosaur(process.env.MAILOSAUR_API_KEY)
const mailbox = new Mailosaur.Mailbox(process.env.MAILOSAUR_MAILBOX_ID)
const RECIPIENT_EMAIL = mailbox.generateEmailAddress()

async function getEmails(address, timeout = 5000) {
  return new Promise(async (resolve, reject) => {
    var waited = 0
    while (waited < timeout) {
      mailbox.getEmailsByRecipient(RECIPIENT_EMAIL, (err, emails) => {
        if (err) { return reject(err) }
        else {
          if (emails.length > 0) {
            mailbox.deleteAllEmail(()=>{ resolve(emails) })
          }
        }
      })
      await sleep(1000)
      waited += 1000
    }
    reject(`no emails found after ${waited} ms`)
  })
}

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
  t.ok(result)
  await sleep(100)
  const emails = await getEmails(RECIPIENT_EMAIL)
  t.is(emails.length, 1)
})
