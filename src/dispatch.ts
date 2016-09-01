/// <reference path="./firebase-queue.d.ts" />
import * as FirebaseQueue from 'firebase-queue'
import {when, compose, equals, keys, prop, merge, type} from 'ramda'

import * as test from 'tape-async'
import {spy} from 'sinon'

const log = console.log.bind(console)

/**
 * If the given argument is an object with a single property called 'key'
 * then unwrap it and return the value of the property. Otherwise return the
 * object.
 *
 * @type {U}
 */
const objectOrKey = when(
  compose(
    equals(['key']),
    keys
  ),
  prop('key')
)

/**
 * Given a domain, event and a payload that represents the response from
 * calling a seneca action, build a suitable response to send back to the queue.
 *
 * @returns {{domain: any, event: any, payload: (any|boolean)}}
 */
function buildResponse(domain, event, payload):PayloadResponse {
  return {domain, event, payload: payload || false}
}

/**
 * Given the queue dispatch payload generate a seneca pattern where domain
 * becomes role, action becomes cmd, and payload is merged.
 * @returns {{role: any, cmd: any, uid: any}&T2}
 */
function buildPattern({domain, action, uid, payload}):SenecaPattern {
  return merge({
    role: domain,
    cmd: action,
    uid,
  }, payload)
}

/**
 * Given a seneca pattern create a seneca auth pattern using our auth role
 */
function buildAuthPattern(pattern:SenecaPattern):SenecaPattern {
  return merge(pattern, {
    role: 'Auth',
    model: pattern.role,
  })
}

/**
 * Wrap a call to seneca.act in a try/catch. If an error is thrown return
 * the error message as the response in the form {error}
 *
 * @param seneca
 * @param pattern
 * @returns {SenecaResponse}
 */
async function tryAct(seneca, pattern:SenecaPattern):Promise<SenecaResponse> {
  try {
    const response = await seneca.act(pattern)
    return type(response) === 'Object' ? response : {response}
  } catch (error) {
    return {error}
  }
}

/**
 * Given a seneca pattern call an Auth action for the pattern
 *
 * @param seneca
 * @param pattern
 * @returns {{reject: any}|SenecaResponse}
 */
async function authenticatePattern(seneca, pattern:SenecaPattern):Promise<SenecaResponse> {
  const response = await tryAct(seneca, buildAuthPattern(pattern))
  return response.error ? {reject: response.error} : response
}

/**
 * Given a seneca instance and pattern, first call an Auth action for the
 * pattern. If that returns reject then return, otherwise carry on and call
 * the original pattern
 *
 * @param seneca
 * @param pattern
 * @returns {any}
 */
async function actAuthenticated(seneca, pattern:SenecaPattern):Promise<SenecaResponse> {
  const auth = await authenticatePattern(seneca, pattern)

  if (auth.reject) {
    return {reject: auth.reject}
  }

  const combinedPattern = merge(pattern, auth)
  return await tryAct(seneca, combinedPattern)
}

/**
 * Generate an async function that executes the queue payload data as a
 * seneca action.
 *
 * @param seneca
 * @returns {({domain, action, uid, payload}:{domain: any, action: any, uid: any, payload: any})=>Promise<SenecaResponse>}
 */
function createHandler(seneca) {
  return async function handle({domain, action, uid, payload}): Promise<SenecaResponse> {
    const pattern = buildPattern({domain, action, uid, payload})
    const taskResponse = await actAuthenticated(seneca, pattern)

    if (taskResponse.error || taskResponse.reject) {
      log('queue error', pattern, taskResponse)
    }

    return taskResponse
  }
}

/**
 * Generate a function that generates an async function that writes the payload
 * response data back into firebase.
 *
 * @param ref
 * @returns {({domain, action, uid}:{domain: any, action: any, uid: any})=>
 *   (response:SenecaResponse)=>Promise<SenecaResponse>}
 */
function createResponder(ref:Firebase) {
  return function respond({domain, action, uid}) {
    return async function(response:SenecaResponse):Promise<SenecaResponse> {
      log('responding with', response)
      await ref.child('responses').child(uid).push(buildResponse(domain, action, objectOrKey(response)))
      return response
    }
  }
}

/**
* Process the firebase queue and turn messages there into seneca tasks.
*/
export function startDispatch(ref:Firebase, seneca) {
  const handle = createHandler(seneca)
  const responder = createResponder(ref)

  return new FirebaseQueue(ref, function(data, progress, resolve, reject) {
    handle(data)
      .then(responder(data))
      .then(resolve)
      .catch(reject)
  })
}

export function runTests() {
  test('createHandler', async function (t) {
    const data = {
      domain: 'test', action: 'createHandlerTest', uid: 'abc123',
      payload: {some: 'data'}
    }
    const actSpy = spy(() => ({pass: 'on'}))
    const seneca = {act: actSpy}
    const handler = createHandler(seneca)
    const response = await handler(data)

    t.ok(response)
    t.equals(actSpy.callCount, 2)
    t.deepEqual(actSpy.getCall(0).args, [{
      model: 'test',
      cmd: 'createHandlerTest',
      role: 'Auth',
      some: 'data',
      uid: 'abc123',
    }])
    t.deepEqual(actSpy.getCall(1).args, [{
      role: 'test',
      cmd: 'createHandlerTest',
      some: 'data',
      pass: 'on',
      uid: 'abc123',
    }])
    t.deepEquals(response, {pass: 'on'})
  })

  test('createResponder', async function (t) {
    const data = {domain: 'test', action: 'createResponderTest', uid: 'abc123'}
    const ref = {} as Firebase

    const childSpy = spy(() => ref)
    const pushSpy = spy()

    ref.child = childSpy
    ref.push = pushSpy

    const responder = createResponder(ref)
    const respond = responder(data)

    const response = await respond({some: 'data'})

    t.ok(response)
    t.equals(childSpy.callCount, 2)
    t.deepEquals(childSpy.getCall(0).args, ['responses'])
    t.deepEquals(childSpy.getCall(1).args, ['abc123'])
    t.equals(pushSpy.callCount, 1)
    t.deepEquals(pushSpy.getCall(0).args, [{
      domain: 'test',
      event: 'createResponderTest',
      payload: {some: 'data'}
    }])
  })
}
