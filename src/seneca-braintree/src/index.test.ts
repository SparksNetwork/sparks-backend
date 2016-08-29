import * as test from 'tape-async'
import {spy, stub} from 'sinon'
import {stubs, SenecaWithPlugin} from '../../testUtil'

import {omit} from 'ramda'

import {plugin} from './index'

const PluginArgs = () => {
  const createTransaction = stub().returns({result: Symbol()})
  const generateClientToken = stub().returns(Symbol())
  return {
    braintree: stub().returns({generateClientToken, createTransaction}),
    generateClientToken,
    createTransaction,
  }
}

const PluginOptions = () => ({
  environment: Symbol(),
  merchantId: Symbol(),
  publicKey: Symbol(),
  privateKey: Symbol(),
})

const testPluginArgs = arg =>
  test(`plugin will fail to initialize if no ${arg} is passed`, async function(t) {
    t.throws(() => plugin(PluginArgs())(omit([arg],PluginOptions())))
  })

for (let requiredArg of ['environment', 'merchantId', 'publicKey', 'privateKey']) {
  testPluginArgs(requiredArg)
}

test('generateClientToken calls the braintree api generated with api key', async function(t) {
  const pargs = PluginArgs()
  const popts = PluginOptions()
  const seneca = await SenecaWithPlugin(plugin(pargs), popts)
  const result = await seneca.act({
    role: 'braintree',
    cmd: 'generateClientToken',
  })

  t.deepEqual(pargs.braintree.firstCall.args, [popts], 'braintree not initialized with proper args')
  t.deepEqual({token: pargs.generateClientToken()}, result, 'does not return the generated client token')
})

const createTransactionArgs = () => ({
  role: 'braintree',
  cmd: 'createTransaction',
  amount: Symbol(),
  paymentMethodNonce: Symbol(),  
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

for (let requiredArg of ['amount', 'paymentMethodNonce']) {
  testRequiredArgs('createTransaction', createTransactionArgs(), requiredArg)
}

test('createTransaction calls the braintree api generated with api key and returns the result', async function(t) {
  const pargs = PluginArgs()
  const popts = PluginOptions()
  const margs = createTransactionArgs()
  const seneca = await SenecaWithPlugin(plugin(pargs), popts)
  const result = await seneca.act(margs)

  t.deepEqual(pargs.braintree.firstCall.args, [popts], 'braintree not initialized with proper args')
  t.deepEqual(pargs.createTransaction.firstCall.args, [{
    amount: margs.amount,
    paymentMethodNonce: margs.paymentMethodNonce,
  }])
  t.deepEqual(pargs.createTransaction(), result, 'call did not return transaction results')
})
