import {objToRows} from '../firebase/collections'
import * as Firebase from 'firebase'
import * as Mailchimp from 'mailchimp-api-v3'
import * as crypto from 'crypto'

import {
  pipe, last, split, splitEvery, uniqBy,
  map, pluck, sum, flatten, values, toLower,
} from 'ramda'

if (!process.env.MAILCHIMP_API_KEY) { throw('Need MAILCHIMP_API_KEY') }
if (!process.env.FIREBASE_HOST) { throw('Need FIREBASE_HOST') }

const VOLUNTEER_LIST_ID = '60d0585543'

const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY)
const fb = new Firebase(process.env.FIREBASE_HOST)

const firstName = fullName => split(' ', fullName)[0]
const lastName = fullName => last(split(' ', fullName))
const uniqEmailsOnly = uniqBy((rec:any) => rec.email)
const hash = email => crypto.createHash('md5').update(toLower(email)).digest('hex')


function engagementStatus(engagement) {
  const {
    isApplied = false,
    isAccepted = false,
    isConfirmed = false,
    declined = false,
  } = engagement

  if (declined) {
    return 'REJECTED'
  }

  if (isApplied) {
    if (isAccepted) {
      if (isConfirmed) {
        return 'CONFIRMED'
      }
      return 'APPROVED'
    }
    return 'APPLIED'
  }
  return 'INCOMPLETE'
}

function profileToMember({email, fullName}) {
  return {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: firstName(fullName),
      LNAME: lastName(fullName),
    }
  }
}

// async function batchSubscribeMailchimp(members) {
//   console.log('posting', members[0])
//   return mailchimp.post(
//     `/lists/${VOLUNTEER_LIST_ID}`,
//     {
//       members,
//       update_existing: false,
//     }
//   )
// }

// async function rowsToListSubscriptions(rows) {
//  return rows.map(profileToMember)
// }




// async function updateSubscribers() {
//   return fb.child('Profiles')
//     .once('value')
//     .then(snap => snap.val())
//     .then(objToRows)
//     .then(uniqEmailsOnly)
//     .then(rowsToListSubscriptions)
//     .then(splitEvery(500))
//     .then(batches => Promise.all(batches.map(batchSubscribeMailchimp)))
// }

async function getFirebaseData() {
  console.log('fetching firebase data...')
  return Promise.all([
    fb.child('Profiles').once('value').then(s => s.val()),
    fb.child('Projects').once('value').then(s => s.val()),
    fb.child('Opps').once('value').then(s => s.val()),
    fb.child('Engagements').once('value').then(s => s.val()),
  ])
}

async function postMembers(allMembers, update_existing = false) {
  console.log('posting', allMembers.length, ' with update_existing =', update_existing)
  return Promise.all(
    splitEvery(500, allMembers).map(members => mailchimp.post(
      `/lists/${VOLUNTEER_LIST_ID}`,
      {members, update_existing,},
    ))
  )
}

async function updateMergeFields(allMembers) {
  console.log('updating', allMembers.length)
  const calls = allMembers.map(member => ({
    method: 'patch',
    path: `/lists/${VOLUNTEER_LIST_ID}/members/${hash(member.email_address)}`,
    body: member,
  }))
  return mailchimp.batch(calls)
  // return Promise.all(
  //   splitEvery(500, allMembers).slice(0,1).map(members => mailchimp.post(
  //     `/lists/${VOLUNTEER_LIST_ID}`,
  //     {members, update_existing,},
  //   ))
  // )
}
// async function postMembers(allMembers, update_existing = false) {
//   console.log('posting', allMembers.length, ' with update_existing =', update_existing)
//   return Promise.all(
//     splitEvery(500, allMembers).map(members => mailchimp.post(
//       `/lists/${VOLUNTEER_LIST_ID}`,
//       {members, update_existing,},
//     ))
//   )
// }

// const updateMergeFields = members => postMembers(members, true)
// const updateMergeFields = members => postMembers(members, false)
const addNewMembers = members => postMembers(members, false)

const toMembers = pipe(objToRows, uniqEmailsOnly, map(profileToMember))

function toMergeFields(profiles, projects, opps, engagements) {
  const emailsToUpdate = {}
  objToRows(engagements).forEach(e => {
    try {
      const profile = profiles[e['profileKey']]
      const opp = opps[e['oppKey']]
      const project = projects[opp.projectKey]
      if (profile && opp && project) {
        emailsToUpdate[profile.email] = {
          email_address: profile.email,
          merge_fields: {
            FNAME: firstName(profile.fullName),
            LNAME: lastName(profile.fullName),
            SOURCECODE: 'app',
            ENGAGEMENT: engagementStatus(e),
            PROJECT: project.code,
            OPP: opp.name,
          }
        }
      }
    } catch (err) {
      console.log('could not process engagement', e.$key)
    }
  })
  return values(emailsToUpdate)
}

const countCreated = pipe(pluck('total_created'), sum)
const countErrors = pipe(pluck('error_count'), sum)

async function updateMailchimp() {
  return getFirebaseData()
    .then(([profiles, projects, opps, engagements]) =>
      addNewMembers(toMembers(profiles))
        // .then((result:any) => console.log(JSON.stringify(result, null, 2)))
        .then((results:any) => {
          console.log(countCreated(results), 'created,', countErrors(results), 'errors')
          console.log('new members', JSON.stringify(flatten(pluck('new_members', results)), null, 2))
        })
        .then(() => updateMergeFields(toMergeFields(profiles, projects, opps, engagements)))
        .then(results => console.log('updated:', results.length))

      // updateMergeFields(toMergeFields(profiles, projects, opps, engagements))
      //   // .then(result => console.log(JSON.stringify(result, null, 2)))
      //   .then(results => console.log('updated:', results.length))
    )
}

updateMailchimp()
.then(result => {
  process.exit()
})
.catch(err => {
  console.log(err)
  process.exit()
})

