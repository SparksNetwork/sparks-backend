import Authorizations from './authorization'
import auth from './auth'
import {getStuff} from './util'
import tasks from './tasks'
import {makeCollections} from './collections'
import {omit} from 'ramda'

const modelNames = [
  'Arrivals',
  'Assignments',
  'Commitments',
  'Engagements',
  'Fulfillers',
  'Memberships',
  'Opps',
  'Organizers',
  'Projects',
  'ProjectImages',
  'Profiles',
  'Shifts',
  'Teams',
  'TeamImages',
]

export default function({fb, remote}) {
  const seneca = this
  const models = makeCollections(fb, modelNames)
  const scopedGetStuff = getStuff(models)

  models.Users = {
    set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
  }

  seneca.add({role:'Firebase',cmd:'get'}, (msg, respond) => {
    scopedGetStuff(omit(['role','cmd'], msg))
      .then(stuff => respond(null, stuff))
  })

  remote.models = models
  remote.auths = Authorizations(models, scopedGetStuff)

  seneca.use(tasks, remote)
  seneca.ready(() => {
    seneca.use(auth, {modelNames})

    seneca.ready(() => console.log(seneca.find({role:'Shifts',cmd:'create'})))
  })

  return 'sn'
}
