import * as assert from 'assert'
import {keys, merge} from 'ramda'

const ROLE = 'firebase'

export function objToRows(obj) {
  return obj && keys(obj).map(key => merge(obj[key], {$key: key})) || []
}

export function plugin({Firebase}) {
  return function({firebaseHost}) {
    const seneca = this

    assert(firebaseHost, 'must pass firebaseHost in options')
    seneca.add({init: ROLE}, init({seneca, Firebase, firebaseHost}))
    return ROLE
  }
}

function init({seneca, Firebase, firebaseHost}) {
  return async function() {
    const firebase = new Firebase(firebaseHost)

    seneca.add({role: ROLE, cmd: 'push'}, push({firebase}))
    seneca.add({role: ROLE, cmd: 'get'}, get({firebase}))
    seneca.add({role: ROLE, cmd: 'first'}, first({seneca}))
    seneca.add({role: ROLE, cmd: 'by'}, by({firebase}))
  }
}

function push({firebase}) {
  return async function({model, values}) {
    assert(model, 'must pass model name to push')
    assert(values, 'must pass values to push')
    const result = firebase.child(model).push(values)
    return {key: result}
  }
}

function get({firebase}) {
  return async function({model, key}) {
    assert(model, 'must pass model name to get')
    assert(key, 'must pass key to get')
    const result = await firebase.child(model).once(values)
    return result.val()
  }
}

function first({seneca}) {
  return async function({model, by, value}) {
    assert(model, 'must pass model name to first')
    assert(by, 'must pass "by" field to first')
    assert(value, 'must pass "value" field to first')
    const result = await seneca.act({
      role: ROLE,
      cmd: 'by',
      model,
      by,
      value,
    })
    return result.length > 0 ? result[0] : null
  }
}

function by({firebase}) {
  return async function({model, by, value}) {
    assert(model, 'must pass model name to by')
    assert(by, 'must pass "by" field to by')
    assert(value, 'must pass "value" field to by')
    const result =
      await firebase.child(model).orderByChildKey(by).equalTo(value).once('value')
    return objToRows(result)
  }
}
