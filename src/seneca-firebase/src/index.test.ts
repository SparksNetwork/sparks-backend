import * as test from 'tape-async'
import {spy, stub} from 'sinon'
import {stubs, SenecaWithPlugin} from '../../testUtil'

import {omit} from 'ramda'
import * as assert from 'assert'

import {plugin} from './index'

const PluginOptions = () => ({
  firebaseHost: Symbol(),
})

const PluginArgs = () => {
  const {push, on, once} = stubs('push', 'on', 'once')
  const child = stub().returns({push, on, once})
  return {
    Firebase: stub().returns({child}),
    child,
    push,
    on,
    once,
  }
}

test('plugin will fail to initialize if no firebaseHost is passed', async function(t) {
  t.throws(() => plugin(PluginArgs())(omit(['firebaseHost'],PluginOptions())))
})

const pushArgs = () => ({
  role: 'firebase',
  cmd: 'push',
  model: Symbol(),
  values: Object(),
})

const testRequiredArgs = (handler, args, requiredArg) =>
  test(`${handler} requires ${requiredArg} or throws an error`, async function(t) {
    t.plan(1)
    const seneca = await SenecaWithPlugin(plugin(PluginArgs()), PluginOptions())
    try { await seneca.act(omit([requiredArg], args)) }
    catch (err) {
      t.equal(err.name, 'AssertionError')
    }
  })

for (let requiredArg of ['model', 'values']) {
  testRequiredArgs('push', pushArgs(), requiredArg)
}

test('push will call fb api with child and values', async function(t) {
  const pargs = PluginArgs()
  const popts = PluginOptions()
  const margs = pushArgs()
  const seneca = await SenecaWithPlugin(plugin(pargs), popts)
  const result = await seneca.act(margs)

  t.deepEqual(pargs.Firebase.firstCall.args, [popts.firebaseHost], 'Firebase not initialized with host')
  t.deepEqual(pargs.child.firstCall.args, [margs.model], 'child model not selected')
  t.deepEqual(pargs.push.firstCall.args, [margs.values], 'values not passed to push')
})

