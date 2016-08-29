
import * as assert from 'assert'

const ROLE = 'braintree'

export function plugin({braintree}) {
  return function({environment, merchantId, publicKey, privateKey}) {
    const seneca = this

    // assert(false)

    assert(environment, 'sendgrid plugin needs environment option to initialize')
    assert(merchantId, 'sendgrid plugin needs merchantId option to initialize')
    assert(publicKey, 'sendgrid plugin needs publicKey option to initialize')
    assert(privateKey, 'sendgrid plugin needs privateKey option to initialize')

    seneca.add({init: 'braintree'}, init({seneca, braintree, environment, merchantId, publicKey, privateKey}))

    return ROLE
  }
}

function init({seneca, braintree, environment, merchantId, publicKey, privateKey}) {
  return function() {
    const {generateClientToken, createTransaction} =
      braintree({environment, merchantId, publicKey, privateKey})

    seneca.add({role: ROLE, cmd: 'generateClientToken'}, _generateClientToken({generateClientToken}))
    seneca.add({role: ROLE, cmd: 'createTransaction'}, _createTransaction({createTransaction}))
  }
}

function _generateClientToken({generateClientToken}) {
  return async function() {
    return {
      token: generateClientToken()
    }
  }
}

function _createTransaction({createTransaction}) {
  return async function({amount, paymentMethodNonce}) {
    assert(amount, 'must pass amount to createTransaction')
    assert(paymentMethodNonce, 'must pass paymentMethodNonce to createTransaction')
    return createTransaction({
      amount,
      paymentMethodNonce,
    })
  }
}

    // const result = await gateway.createTransaction({
    //   amount,
    //   paymentMethodNonce: nonce,
    // }, {
    //   submitForSettlement: true,
    // })

    // console.log('braintree result:', result.success, result.transaction.status)

    // return result