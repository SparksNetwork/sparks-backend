import {
  byKey, firstByChildKey, byChildKey
} from './collections'

interface FirebaseValue {
  [propName:string]:FirebaseValue | string | boolean | number
}

export function Model(model:string) {
  return function(seneca) {
    return {
      push: function(values:FirebaseValue):Promise<KeyResponse> {
         return seneca.act('role:Firebase,cmd:push', {model, values})
      },
      update: function(key:string, values:FirebaseValue):Promise<KeyResponse> {
        return seneca.act('role:Firebase,cmd:update', {model, key, values})
      },
      remove: function(key:string):Promise<KeyResponse> {
        return seneca.act('role:Firebase,cmd:remove', {model, key})
      }
    }
  }
}

export default function(fb) {
  this.add({role:'Firebase'}, function(msg, respond) {
    respond(null, {fb})
  })

  this.add({role:'Firebase',cmd:'get'}, async function({model, key}) {
    return await byKey(fb.child(model))(key)
  })

  this.add({role:'Firebase',cmd:'first'}, async function({model, by, value}) {
    return await firstByChildKey(fb.child(model))(by, value)
  })

  this.add({role:'Firebase',cmd:'by'}, async function({model, by, value}) {
    return await byChildKey(fb.child(model))(by, value)
  })

  this.add({role:'Firebase',cmd:'update'}, async function({model, key, values}) {
    return await fb.child(model).child(key).update(values)
      .then(() => ({key}))
      .catch(error => ({error}))
  })

  this.add({role:'Firebase',cmd:'push'}, async function({model, values}) {
    const key = fb.child(model).push(values).key()
    return {key}
  })

  this.add({role:'Firebase',cmd:'set'}, async function({model, key, values}) {
    return await fb.child(model).child(key).set(values)
      .then(() => ({key}))
      .catch(error => ({error}))
  })

  this.add({role:'Firebase',cmd:'remove'}, async function({model, key}) {
    if (!key) { return {error: 'no key'} }
    return await fb.child(model).child(key).remove()
  })

  this.add({role:'Firebase',model:'Users',cmd:'set'}, async function({uid, profileKey}) {
    return await fb.child('Users').child(uid).set(profileKey)
  })

  /**
  * Special handling for the users model because we store there just key value
  * string pairs and seneca does not like returning primitive types
  */
  this.add({role:'Firebase',model:'Users',cmd:'get'}, async function({uid}) {
    const profileKey = await fb.child('Users').child(uid)
      .once('value')
      .then(s => s.val())

    return {profileKey}
  })

  return 'firebase-sn'
}
