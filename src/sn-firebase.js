import Firebase from 'firebase'
import {getStuff} from './util'
import {makeCollections} from './collections'
import {omit} from 'ramda'

export default function({collections, cfg: {FIREBASE_HOST, FIREBASE_TOKEN}}) {
  const fb = new Firebase(FIREBASE_HOST)
  console.log('Connected firebase to', FIREBASE_HOST)

  const models = makeCollections(fb, collections)
  models.Users = {
    set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
  }

  const scopedGetStuff = getStuff(models)

  this.add({role:'Firebase'}, function(msg, respond) {
    respond(null, {fb})
  })

  this.add({role:'Firebase',cmd:'Models'}, function(msg, respond) {
    respond(null, {models})
  })

  this.add({role:'Firebase',cmd:'get'}, function(msg, respond) {
    scopedGetStuff(omit(['role','cmd'], msg))
      .then(stuff => respond(null, stuff))
  })

  this.add({init:'sn-firebase'}, function(args, respond) {
    fb.authWithCustomToken(FIREBASE_TOKEN.trim(), err => {
      respond(err)
    })
  })

  return 'sn-firebase'
}
