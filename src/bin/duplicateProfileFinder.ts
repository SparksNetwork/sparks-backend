import load from '../load'
import {values, test} from 'ramda'
import {objToRows} from '../collections';
import * as promptly from 'promptly'

type ProfileArray = Array<Profile>
type ProfileArrays = Array<ProfileArray>

async function findDuplicates() {
  const seneca = await load() as any
  const get = spec => seneca.act('role:Firebase,cmd:get', spec)

  const {fb} = await seneca.act('role:Firebase') as { [fb:string]:Firebase }

  const profiles:ProfileArray = objToRows((await fb.child('Profiles').once('value')).val()) as ProfileArray
  console.log(profiles.length)

  const matchDuplicates:(ProfileArray) => ProfileArrays = profiles => {
    const emails = {}

    for (let profile of profiles) {
      const ary = emails[profile.email] || []
      ary.push(profile)
      emails[profile.email] = ary.sort((a,b) => {
        if (test(/[\-:]/, a.uid)) {
          return 1
        }
        return -1
      })
    }

    return values<ProfileArray>(emails).filter(profiles => profiles.length > 1)
  }

  const duplicateProfiles:ProfileArrays = matchDuplicates(profiles)
  console.log('='.repeat(30))
  console.log(duplicateProfiles.length)

  for (let profiles of duplicateProfiles) {
    console.log(profiles[0].email, 'has', profiles.length, 'profiles')
  }

  const answer = await promptly.confirm('Continue?')
  if (!answer) { return }

  for (let profiles of duplicateProfiles) {
    console.log(profiles[0].email, profiles[0].uid)

    const key = profiles[0].$key

    for (let profile of profiles.slice(1)) {
      const {engagements, arrivals, assignments, fulfillers, organizers} = await get({
        engagements: {profileKey: profile.$key},
        arrivals: {profileKey: profile.$key},
        assignments: {profileKey: profile.$key},
        fulfillers: {authorProfileKey: profile.$key},
        organizers: {profileKey: profile.$key},
      })

      console.log(`  ${profile.uid}`)
      console.log(`    ${engagements.length} engagements`)
      console.log(`    ${arrivals.length} arrivals`)
      console.log(`    ${assignments.length} assignments`)
      console.log(`    ${fulfillers.length} fulfillers`)
      console.log(`    ${organizers.length} organizers`)

      for (let engagement of engagements) {
        await fb.child('Engagements').child(engagement.$key).child('profileKey').set(key)
      }

      for (let arrival of arrivals) {
        await fb.child('Arrivals').child(arrival.$key).child('profileKey').set(key)
      }

      for (let assignment of assignments) {
        await fb.child('Assignments').child(assignment.$key).child('profileKey').set(key)
      }

      for (let fulfiller of fulfillers) {
        await fb.child('Fulfillers').child(fulfiller.$key).child('authorProfileKey').set(key)
      }

      for (let organizer of organizers) {
        await fb.child('Organizers').child(organizer.$key).child('profileKey').set(key)
      }

      await fb.child('Users').child(profile.uid).set(key)
      await fb.child('Profiles').child(profile.$key).child('duplicate').set(true)
    }
  }
}

findDuplicates().then(() => process.exit())