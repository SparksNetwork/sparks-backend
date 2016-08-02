import {identity, join, toPairs, filter, has, cond, always, pipe, map, prop} from 'ramda'
import {format} from 'util'
import Firebase from 'firebase'

// converts a field to a quote-wrapped field
export const quoter = str => format('"%s"', str)

// converts an array of arrays to an array of strings
export const toCsv = map(pipe(map(quoter),join(',')))

// takes a [key, values] item from toPairs and turns it into a single object
export const toRecord = ([key,vals]) => {return {key, ...vals}}

// turns a collection object of {key: record} into an array of objects
export const toRows = pipe(toPairs, map(toRecord))

// returns the status code for an engagement based on presence of fields
const statusCode = cond([
  [prop('declined'), always('REJECTED')],
  [prop('isConfirmed'), always('CONFIRMED')],
  [prop('isAccepted'), always('ACCEPTED')],
  [prop('isApplied'), always('APPLIED')],
])

export function lookupsFrom(host) {
  const fb = new Firebase(host)
  const all = m =>
    fb.child(m).once('value').then(snap => snap.val())
  const one = (m,k) =>
    fb.child(m).child(k).once('value').then(snap => snap.val())
  const by = (m, f, k) =>
    fb.child(m).orderByChild(f).equalTo(k).once('value').then(snap => snap.val())

  return {
    Engagements: async function() { return all('Engagements') },
    Profile: async function(key) { return one('Profiles', key) },
    Project: async function(key) { return one('Projects', key) },
    Opp: async function(key) { return one('Opps', key) },
    Arrival: async function(key) { return by('Arrivals', 'projectKeyProfileKey', key) },
  }
}

export function dummyLookups() {
  return {
    Engagements: async function() {
      return {
        ENG1: {oppKey: 'OPP1', profileKey: 'PRO1'},
        ENG2: {oppKey: 'OPP1', profileKey: 'PRO2'},
        ENG3: {oppKey: 'OPP2', profileKey: 'PRO3'},
      }
    },
    Profile: async function(key) { return {fullName: 'Profile ' + key, email: 'email', phone: 'phone'} },
    Project: async function(key) { return {name: 'Proj ' + key} },
    Opp: async function(key) { return {name: 'Opp ' + key, projectKey: 'PROJ1'} },
    Arrival: async function(key) { return {arrivedAt: '1466771699747'} },
  }
}

export const lensFields = ({key, profile, project, opp, arrival, ...eng}) => [
  eng.profileKey,
  profile.fullName,
  profile.email,
  profile.phone,
  key,
  statusCode(eng),
  eng.amountPaid || '0.00',
  opp.projectKey,
  project.name,
  eng.oppKey,
  opp.name,
  arrival ? 'YES' : 'NO',
]

const filterOrphans = pipe(filter(has('profileKey')), filter(has('oppKey')))

export async function generateEmailRecords(host) {
  const {Engagements, Profile, Project, Opp, Arrival} = lookupsFrom(host)
  // const {Engagements, Profile, Project, Opp, Arrival} = dummyLookups(host)

  async function relativesFor(eng) {
    const opp = await Opp(eng.oppKey)
    if (!opp) { // console.log('no opp!', eng.key, eng.profileKey, eng.oppKey)
      return false
    }
    const [profile, project] = await Promise.all([
      Profile(eng.profileKey),
      Project(opp.projectKey),
    ])
    const pKPK = `${opp.projectKey}-${eng.profileKey}`
    // console.log('pKPK', pKPK)
    const arrival = await Arrival(pKPK)
    // console.log('arrival', pKPK, arrival)
    return {...eng, profile, project, opp, arrival}
  }

  const rows = pipe(toRows, filterOrphans)(await Engagements())
  const fullRows = await Promise.all(map(relativesFor, rows))

  return pipe(filter(identity), map(lensFields), toCsv)(fullRows)
}

export async function findRecord(host, collection, field, value) {
  const fb = new Firebase(host)
  const lookup = () =>
    fb.child(collection).orderByChild(field).equalTo(value).once('value').then(snap => snap.val())
  const recs = await lookup()
  console.log('recs', recs)
  return toRows(recs)
}
