import * as Inflection from 'inflection'
import * as R from 'ramda'
import {
  keys,
  objOf,
  values,
  whereEq,
  find,
  merge,
  mergeAll,
  filter,
  mapObjIndexed,
  lensPath,
  propEq,
  flatten,
  compose,
  head,
  tail,
  toLower,
  applySpec
} from 'ramda'

function mockFirebase() {
  let store = {}
  let snapshot = store

  function set(fixtures) {
    const withKeys = mapObjIndexed(
      (fixture, $key) => (merge(fixture, {$key}))
    )

    for (let key of keys(fixtures)) {
      store[key] = withKeys(fixtures[key])
    }

    return store
  }

  function arrayGet(key, value) {
    const ary = values(store[key]) || []
    return objOf(key, filter(whereEq(value))(ary))
  }

  function modelGet(key, value) {
    const modelName = Inflection.pluralize(key)
    if (!store[modelName]) {
      return null
    }

    if (typeof value === 'string') {
      return objOf(key, store[modelName][value])
    } else {
      const ary = values(store[modelName])
      return objOf(key, find(whereEq(value))(ary))
    }
  }

  function get(spec) {
    const results = keys(spec).map(key => {
      const value = spec[key]
      const fn = Inflection.pluralize(key) === key ? arrayGet : modelGet
      return fn(key, value)
    })

    return mergeAll(results)
  }

  const toPath = compose(
    flatten,
    applySpec([
      compose(toLower, head),
      tail
    ]),
    flatten
  )

  this.add({role: 'Fixtures', cmd: 'set'}, async function (msg) {
    return set(msg.fixtures)
  })

  this.add({role: 'Fixtures', cmd: 'get'}, async function () {
    return R.clone(store)
  })

  this.add({role: 'Fixtures', cmd: 'snapshot'}, async function () {
    snapshot = R.clone(store)
    return {}
  })

  this.add({role: 'Fixtures', cmd: 'restore'}, async function () {
    store = R.clone(snapshot)
    return {}
  })

  this.add({role: 'Firebase', cmd: 'get'}, async function (msg) {
    return store[msg.model.toLowerCase()][msg.key]
  })

  this.add({role: 'Firebase', cmd: 'first'}, async function (msg) {
    const ary = values(store[msg.model.toLowerCase()])
    return find(propEq(msg.by, msg.value))(ary)
  })

  this.add({role: 'Firebase', cmd: 'by'}, async function (msg) {
    const ary = values(store[msg.model.toLowerCase()])
    return filter(propEq(msg.by, msg.value))(ary)
  })

  function generateKey() {
    return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)
  }

  this.add({
    role: 'Firebase',
    cmd: 'set'
  }, async function ({model, path, key, values}) {
    const lens = lensPath(flatten([path || model.toLowerCase(), key]))
    store = R.set(lens, values)
    return {key}
  })

  this.add({
    role: 'Firebase',
    cmd: 'set',
    model: 'Users'
  }, async function ({uid, profileKey}) {
    const lens = lensPath(['users', uid])
    store = R.set(lens, profileKey, store)
    return {uid}
  })

  this.add({
    role: 'Firebase',
    cmd: 'get',
    model: 'Users'
  }, async function ({uid}) {
    const lens = lensPath(['users', uid])
    const profileKey = R.view(lens, store)
    return {profileKey}
  })

  this.add({role: 'Firebase', cmd: 'push'}, async function (msg) {
    try {
      const {values, model, path} = msg
      const key = generateKey()
      const cpath = toPath([path || model, key])
      const lens = lensPath(cpath)

      store = R.set(lens, merge(values, {$key: key}), store)

      return {key}
    } catch (err) {
      console.log('WTFFFFF', err)
    }
  })

  this.add({
    role: 'Firebase',
    cmd: 'update'
  }, async function (msg): Promise<TaskResponse> {
    const {key, values, model, path} = msg
    const lens = lensPath(toPath([path || model, key]))
    const item = R.view(lens, store)

    if (!item) {
      return {error: 'Item not found'}
    } else {
      const newItem = merge(item, values)
      store = R.set(lens, newItem, store)
      return {key}
    }
  })

  this.add({role: 'Firebase', cmd: 'remove'}, async function ({model, path, key}) {
    store = R.dissocPath(toPath([path || model, key]), store)
    return {key}
  })

  this.add('role:Firebase,cmd:inc', async function ({model, path, key, child, by}) {
    const lens = lensPath(toPath([path || model, key, child]))
    const value = R.view(lens, store) || 0
    store = R.set(lens, value + (by || 1), store)
    return {key}
  })
}

export default mockFirebase
