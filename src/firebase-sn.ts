import {firebase} from './process-firebase'
import {makeCollections} from './collections'
import {keys} from 'ramda'

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

function modelPlugin({models, name}) {
  const model = models[name]

  this.add({role:'Firebase',model:name,cmd:'get'}, async function({key}) {
    return await model.get(key)
  })

  this.add({role:'Firebase',model:name,cmd:'first'}, async function({by, value}) {
    return await model.first(by, value)
  })

  this.add({role:'Firebase',model:name,cmd:'by'}, async function({by, value}) {
    return await model.by(by, value)
  })

  this.add({role:'Firebase',model:name,cmd:'update'}, async function({key, values}):Promise<SenecaResponse> {
    try {
      await model.child(key).update(values)
      return {key}
    } catch (error) {
      return {error}
    }
  })

  this.add({role:'Firebase',model:name,cmd:'push'}, async function({values}) {
    const key = model.push(values).key()
    return {key}
  })

  this.add({role:'Firebase',model:name,cmd:'set'}, async function({key, values}) {
    await model.child(key).set(values)
    return {key}
  })

  this.add({role:'Firebase',model:name,cmd:'remove'}, async function({key}):Promise<SenecaResponse> {
    if (!key) { return {error: 'no key'} }
    await model.child(key).remove()
    return {key}
  })

  return `${name}-model`
}


export default function({collections}) {
  let fb:Firebase
  let models

  this.add({role:'Firebase'}, async function() {
    return {fb}
  })

  this.add({role:'Firebase',cmd:'Models'}, async function() {
    return {models}
  })

  this.add({role:'Firebase',cmd:'Model'}, function({model}) {
    return {model: models[model]}
  })

  this.add({role:'Firebase',model:'Users',cmd:'set'}, async function({uid, profileKey}) {
    return await models.Users.set(uid, profileKey)
  })

  /**
  * Special handling for the users model because we store there just key value
  * string pairs and seneca does not like returning primitive types
  */
  this.add({role:'Firebase',model:'Users',cmd:'get'}, async function({uid}) {
    const profileKey = await models.Users.get(uid)
    return {profileKey}
  })

  this.add({init:'firebase-sn'}, async function() {
    fb = await firebase()
    models = makeCollections(fb, collections)
    models.Users = {
      set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
      get: uid => fb.child('Users').child(uid).once('value').then(s => s.val()),
    }

    const names = keys(models)
    for (let name of names) {
      this.use(modelPlugin, {models, name})
    }

    return {}
  })

  return 'firebase-sn'
}
