import * as assert from 'assert'

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
