import load from '../load'
import {groupWith, eqProps, compose, filter} from 'ramda'
import {objToRows} from "../collections";
import * as promptly from 'promptly'

type ProfileArray = Array<Profile>
type ProfileArrays = Array<ProfileArray>

async function findDuplicates() {
  const seneca = await load() as any
  const get = spec => seneca.act('role:Firebase,cmd:get', spec)

  const {fb} = await seneca.act('role:Firebase') as { [fb:string]:Firebase }

  const profiles:ProfileArray = objToRows((await fb.child('Profiles').once('value')).val()) as ProfileArray
  console.log(profiles.length)

  const matchDuplicates:(ProfileArray) => ProfileArrays = compose<ProfileArray, ProfileArrays, ProfileArrays>(
    filter<ProfileArray>(profiles => profiles.length > 1),
    groupWith<Profile>(eqProps('email'))
  )

  const duplicateProfiles:ProfileArrays = matchDuplicates(profiles)
  console.log('='.repeat(30))
  console.log(duplicateProfiles.length)

  for (let profiles of duplicateProfiles) {
    console.log(profiles[0].email, 'has', profiles.length, 'profiles')

    const key = profiles[0].$key

    for (let profile of profiles.slice(1)) {
      console.log('  Point uid', profile.uid, 'to profile key', key)
    }
  }

  const answer = await promptly.confirm('Continue?')
  if (!answer) { process.exit(); return }

  for (let profiles of duplicateProfiles) {
    process.stdout.write(profiles[0].email)
    process.stdout.write("\t\t")

    const key = profiles[0].$key

    for (let profile of profiles.slice(1)) {
      const {engagements, arrivals, assignments, fulfillers, organizers} = await get({
        engagements: {profileKey: profile.$key},
        arrivals: {profileKey: profile.$key},
        assignments: {profileKey: profile.$key},
        fulfillers: {authorProfileKey: profile.$key},
        organizers: {profileKey: profile.$key},
      })

      console.log('Profile', profile.email)
      console.log(`  ${engagements.length} engagements`)
      console.log(`  ${arrivals.length} arrivals`)
      console.log(`  ${assignments.length} assignments`)
      console.log(`  ${fulfillers.length} fulfillers`)
      console.log(`  ${organizers.length} organizers`)

      for (let engagement of engagements) {
        await fb.child('Engagements').child(engagement.$key).child('profileKey').set(key)
      }

      await fb.child('Users').child(profile.uid).set(key)
    }

    process.stdout.write(" done\n")
  }
}

findDuplicates().then(() => process.exit())