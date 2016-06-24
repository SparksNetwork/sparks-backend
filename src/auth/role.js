import Promise from 'bluebird'
import {
  equals, anyPass, pathOr, juxt, compose, apply, contains, map, prop,
  path, append, propOr, merge, always,
} from 'ramda'

export const isAdmin = propOr(false, 'isAdmin')

export const isEAP = propOr(false, 'isEAP')

export const isUser = (profile, key) => profile && profile.$key === key

// Rules
const profileIsAdmin = pathOr(false, ['profile', 'isAdmin'])
const profileIsEAP = pathOr(false, ['profile', 'isEAP'])
const profileIsObjectOwner = model =>
  compose(
    apply(equals),
    juxt([
      pathOr(false, ['profile', '$key']),
      pathOr(false, [model, 'ownerProfileKey']),
    ])
  )
const profileIsProjectOwner = profileIsObjectOwner('project')
const profileIsOppOwner = profileIsObjectOwner('opp')
const profileIsTeamOwner = profileIsObjectOwner('team')

const profileIsActiveOrganizer = compose(
    apply(contains),
    juxt([
      path(['profile', '$key']),
      compose(
        map(prop('profileKey')),
        prop('organizers')
      ),
    ])
  )

// Lists of rules
const createProjectRules = [
  profileIsAdmin,
  profileIsEAP,
]

const updateProjectRules = [
  profileIsAdmin,
  profileIsProjectOwner,
  profileIsActiveOrganizer,
]

const removeProjectRules = [
  profileIsAdmin,
  profileIsProjectOwner,
]

const updateTeamRules = append(profileIsTeamOwner, updateProjectRules)
const updateOppRules = append(profileIsOppOwner, updateProjectRules)

function pass(ruleFn, rejectionMsg, respond) {
  console.log('construct pass with r', respond)
  return function(obj) {
    if (ruleFn(obj)) {
      console.log('respond with', obj)
      respond(null, obj)
    } else {
      console.log('reject with', rejectionMsg)
      respond(null, {reject: rejectionMsg})
    }
  }
}

export default function() {
  const seneca = this
  const act = Promise.promisify(this.act, {context: this})
  const add = seneca.add.bind(seneca)

  add({role:'Auth'}, ({uid}, respond) =>
    act({role:'Firebase',cmd:'get',profile:{uid}})
      .then(pass(always(true), '', respond))
  )

  add({role:'Auth',cmd:'create',model:'Projects'}, ({uid}, respond) =>
    act({role:'Firebase',cmd:'get',profile:{uid}})
    .then(pass(
      anyPass(createProjectRules),
      'User cannot create project',
      respond))
  )

  add({role:'Auth',cmd:'update',model:'Projects'},
     ({uid, projectKey}, respond) =>
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      project: projectKey,
      organizers: {projectKey},
    })
    .then(pass(
      anyPass(updateProjectRules),
      'User cannot update project',
      respond))
  )

  add({role:'Auth',cmd:'remove',model:'Projects'},
     ({uid, projectKey}, respond) =>
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      project: projectKey,
    })
    .then(pass(
      anyPass(removeProjectRules),
      'User cannot remove project',
      respond))
  )

  add({role:'Auth',cmd:'update',model:'Teams'}, ({uid, teamKey}, respond) =>
    console.log('teams update') ||
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      team: teamKey,
    })
    .then(({profile, team}) =>
      act({role:'Firebase',cmd:'get',
        project: team.projectKey,
        organizers: {projectKey: team.projectKey},
      })
      .then(merge({profile, team})))
    .then(pass(
      anyPass(updateTeamRules),
      'User cannot update team',
      respond))
  )

  add({role:'Auth',cmd:'update',model:'Opps'}, ({uid, oppKey}, respond) =>
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      opp: oppKey,
    })
    .then(({profile, opp}) =>
      act({role:'Firebase',cmd:'get',
        project: opp.projectKey,
        organizers: {projectKey: opp.projectKey},
      })
      .then(merge({profile, opp})))
    .then(pass(
      anyPass(updateOppRules),
        'User cannot update opp',
        respond))
  )

  add({role:'Auth',model:'Shifts'}, function(msg, respond) {
    if (contains(msg.cmd, ['update', 'remove'])) {
      act({role:'Firebase',cmd:'get',shift:msg.key})
        .then(({shift}) =>
          seneca.act({...msg,role:'Auth',cmd:'update',model:'Teams',
            teamKey:shift.teamKey}, respond)
        )
    } else {
      this.prior(msg, respond)
    }
  })

  add({role:'Auth',cmd:'create',model:'Shifts'}, function(msg, respond) {
    console.log('pass to teams update')
    seneca.act({
      ...msg,
      teamKey:msg.values.teamKey,
      role:'Auth',
      cmd:'update',
      model:'Teams'}, respond)
  })
}
