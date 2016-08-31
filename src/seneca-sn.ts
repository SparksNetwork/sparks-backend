import snFirebase from './firebase-sn'
import firebaseGet from './firebase-get'
import auth from './auth'
import tasks from './tasks'

const collections = [
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
  'ShiftChanges',
  'Teams',
  'TeamImages',
]

export default function({cfg}) {
  const seneca = this
  seneca.use(snFirebase, {cfg, collections})
  seneca.use(firebaseGet)
  seneca.use(tasks, {})
  seneca.use(auth, {collections})

  return 'sn'
}
