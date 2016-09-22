import {
  byKey, firstByChildKey, byChildKey
} from './collections'
import {append, reduce} from 'ramda'
import {Test} from "tape-async";
import {test} from "../test/test";

export class Updater {
  private seneca:Seneca
  private path:string[]

  constructor(seneca:Seneca, path:string[]) {
    this.seneca = seneca
    this.path = path
  }

  _act<T>(cmd:string, options:any):Promise<T> {
    return this.seneca.act('role:Firebase', Object.assign({}, options, {
      cmd,
      path: this.path
    }))
  }

  push(values:FirebaseValue) {
    return this._act<KeyResponse>('push', {values})
  }

  update(key:string, values:FirebaseValue) {
    return this._act<KeyResponse>('update', {key, values})
  }

  set(key:string, values:FirebaseValue) {
    return this._act<any>('set', {key, values})
  }

  remove(key:string) {
    return this._act<KeyResponse>('remove', {key})
  }

  child(key:string) {
    return new Updater(this.seneca, append(key, this.path))
  }
}
test(__filename, 'Updater', async function(t:Test) {
  let act
  const spy = require('sinon').spy
  const seneca = {} as Seneca
  const modelUpdater = new Updater(seneca, ['model'])
  const childUpdater = modelUpdater.child('123')

  act = seneca.act = spy()
  modelUpdater.push({name: 'hello'})
  t.deepEqual(act.getCall(0).args, [
    'role:Firebase',
    {
      cmd: 'push',
      path: ['model'],
      values: {name: 'hello'}
    }
  ])

  act = seneca.act = spy()
  modelUpdater.update('123', {name: 'hello'})
  t.deepEqual(act.getCall(0).args, [
    'role:Firebase',
    {
      cmd: 'update',
      path: ['model'],
      key: '123',
      values: {name: 'hello'}
    }
  ])

  act = seneca.act = spy()
  modelUpdater.remove('123')
  t.deepEqual(act.getCall(0).args, [
    'role:Firebase',
    {
      cmd: 'remove',
      path: ['model'],
      key: '123',
    }
  ])

  act = seneca.act = spy()
  childUpdater.update('payment', {token: '123'})
  t.deepEqual(act.getCall(0).args, [
    'role:Firebase',
    {
      cmd: 'update',
      path: ['model', '123'],
      key: 'payment',
      values: {token: '123'}
    }
  ])
})

export function Model(model:string):(seneca:Seneca) => Updater {
  return function(seneca:Seneca):Updater {
    return new Updater(seneca, [model])
  }
}

export default function(fb) {
  function childAtPath(path:string[]):Firebase {
    return reduce((acc, p) => acc.child(p), fb, path)
  }

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

  this.add({role:'Firebase',cmd:'update'}, async function({model, path, key, values}) {
    const child = childAtPath(path || [model]).child(key)
    return await child.update(values)
      .then(() => ({key}))
      .catch(error => ({error}))
  })

  this.add({role:'Firebase',cmd:'push'}, async function({model, path, values}) {
    const key = childAtPath(path || [model]).push(values).key()
    return {key}
  })

  this.add({role:'Firebase',cmd:'set'}, async function({model, path, key, values}) {
    return await childAtPath(path || [model]).child(key).set(values)
      .then(() => ({key}))
      .catch(error => ({error}))
  })

  this.add({role:'Firebase',cmd:'remove'}, async function({model, path, key}):Promise<any> {
    if (!key) { return {error: 'no key'} }
    return await childAtPath(path || [model]).child(key).remove()
      .catch(error => ({error}))
  })

  this.add('role:Firebase,cmd:inc', async function({model, path, key, child, by}) {
    const parent = childAtPath(path || [model]).child(key)
    return await parent.child(child).transaction(currentData => {
      return (currentData || 0) + (by || 1)
    })
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
