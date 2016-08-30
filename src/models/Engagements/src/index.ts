import {compose, uniq, prop} from 'ramda'

const ROLE = 'Engagements'

export function plugin({domain}) {
  const seneca = this
  seneca.add({init: ROLE}, init({seneca, domain}))
  return ROLE
}

function init({seneca, domain}) {
  return async function(args) {
    seneca.add({role: ROLE, cmd: 'create'}, create({seneca}))
    seneca.add({role: ROLE, cmd: 'remove'}, remove({seneca}))
    seneca.add({role: ROLE, cmd: 'notify'}, notify({seneca, domain}))
  }
}

function create({seneca}) {
  return async function({oppKey, profileKey}) {
    const {token} = await seneca.act({
      role:'braintree',
      cmd:'generateClientToken',
    })
    const {key} = await seneca.act({
      role: 'firebase',
      cmd: 'push',
      model: 'Engagements',
      values: {
        oppKey,
        profileKey,
        isApplied: true,
        isAccepted: false,
        isConfirmed: false,
        paymentClientToken: token,        
      },
    })
    await seneca.act({
      role: ROLE,
      cmd: 'notify',
      templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
      subjectTemplate: 'Sit Tight! -project_name- has your application.',
      key,
    })
    return {key}
  }
}

function remove({seneca}) {
  return async function({key}) {
    const {assignments} = await seneca.act({
      role: 'firebase',
      cmd: 'get',
      assignments: {engagementKey: key},
    })

    const assignmentKeys = assignments.map(prop('$key'))
    const shiftKeys = uniq(assignments.map(prop('shiftKey')))

    await Promise.all(assignmentKeys.map(key => seneca.act({
      role: 'firebase',
      cmd: 'remove',
      model: 'Assignments',
      key,
    })))
    await Promise.all(shiftKeys.map(key => seneca.act({
      role: 'Shifts',
      cmd: 'updateCounts',
      key,
    })))
    await seneca.act({
      role: 'firebase',
      cmd: 'remove',
      model: 'Engagements',
      key,
    })
    return {key}
  }
}


function notify({seneca, domain}) {
  return async function({key, templateId, subjectTemplate}) {
    const {engagement, profile, opp, project} = await seneca.act({
      role: 'firebase',
      cmd: 'get',
      engagement: key,
      profile: ['engagement', 'profileKey'],
      opp: ['engagement', 'oppKey'],
      project: ['opp', 'projectKey'],
    })
    const substitutions = {
      '-username-': profile.fullName,
      '-opp_name-': opp.name,
      '-project_name-': project.name,
      '-engagementurl-': `${domain}/engaged/${key}/`,
    }
    const subject = Object.keys(substitutions).reduce((a,x) => a.replace(x, substitutions[x]), subjectTemplate)
    await seneca.act({
      role: 'sendgrid',
      cmd: 'sendTemplate',
      templateId,
      subject,
      recipient: profile.email,
      sender: 'help@sparks.network',
      substitutions,        
    })
  }
}
