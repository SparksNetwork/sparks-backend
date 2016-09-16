import {firebase} from './process-firebase'
import {propEq, join, find, tap, concat, merge, prop} from 'ramda'
import {format} from 'util'
import {objToRows} from './collections'

function out(...msg:any[]):void {
  const str:string = format(...msg)
  process.stderr.write(`${str}\n`)
}

const PROJECT:any = process.argv[2] || null

function getStatusCode(engagement) {
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
}

const snap = s => s.val()

function sortByName([a], [b]) {
  if (a.fullName < b.fullName) { return -1 }
  if (a.fullName > b.fullName) { return 1 }
  return 0
}

async function exportVols() {
  const fb = await firebase()

  fb.child('Projects').once('value')
  .then(s => s.val())
  .then(objToRows)
  .then(find(propEq('name', PROJECT)))
  .then(tap<any>(p => out('Found project', p.name)))
  .then(project =>
    fb.child('Opps')
      .orderByChild('projectKey')
      .equalTo(project.$key)
      .once('value')
    .then(snap)
    .then(objToRows)
    .then(tap<any>(rows => out('Found', rows.length, 'Opps')))
    .then(opps =>
      Promise.all(opps.map(opp =>
        fb.child('Engagements')
          .orderByChild('oppKey')
          .equalTo(opp.$key)
          .once('value')
        .then(snap)
        .then(objToRows)
        .then(tap<any>(rows => out('Found', rows.length, 'Engagements')))
        .then(engs => Promise.all(engs.filter(prop('profileKey')).map(eng =>
          fb.child('Profiles').child(eng.profileKey).once('value')
          .then(snap)
          .then(profile => merge(eng, {profile}))
        )))
        .then(engs => merge(opp, {engs}))
      ))
    )
  )
  .then(opps =>
    opps.reduce((acc, opp:any) =>
      concat(acc, opp.engs.map(eng =>
        [eng.profile.fullName,
          eng.profile.email,
          eng.profile.phone,
          PROJECT,
          getStatusCode(eng),
          opp.name,
        ]
        .map(String)
        .map(str => format('"%s"', str))
      )),
      []
    )
  )
  .then(tap<any>(rows => out('Preparing to write', rows.length, 'rows')))
  .then(rows =>
    rows.map(join(','))
  )
  .then(lines =>
    lines.forEach(line =>
      console.log(line)
    )
  )
  .then(() => process.exit())
  .catch(err => {
    console.error('err', err)
    process.exit()
  })
}

exportVols()
