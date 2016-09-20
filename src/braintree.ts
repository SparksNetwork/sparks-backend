import {Gateway, GatewayOptions} from "../typings/braintree";
const braintree = require('braintree')

export default function(cfg) {
  let gateway:Gateway

  this.add('role:gateway', async function(msg) {
    return await gateway[msg.cmd](msg.options)
  })

  this.add('role:gateway,cmd:createCustomer', function({options}, done) {
    gateway.customer.create(options, done)
  })

  this.add('role:gateway,cmd:deleteCustomer', function({id}, done) {
    gateway.customer.delete(id, done)
  })

  this.add('role:gateway,cmd:findCustomer', function({id}, done) {
    gateway.customer.find(id, done)
  })

  this.add('role:gateway,cmd:updateCustomer', function({id, update}, done) {
    gateway.customer.update(id, update, done)
  })

  this.add('role:gateway,cmd:createTransaction', function({options}, done) {
    gateway.transaction.sale(options, done)
  })

  this.add('role:gateway,cmd:generateClientToken', function({options}, done) {
    gateway.clientToken.generate(options, done)
  })

  this.add('role:gateway,cmd:createSubscription', function({options}, done) {
    gateway.subscription.create(options, done)
  })

  this.add('role:gateway,cmd:findSubscription', function({id}, done) {
    gateway.subscription.find(id, done)
  })

  this.add('role:gateway,cmd:cancelSubscription', function({id}, done) {
    gateway.subscription.cancel(id, done)
  })

  this.wrap('role:gateway', async function(msg) {
    const result = await this.prior(msg)
    console.log('[braintree]', result.success, result)
    return result
  })

  this.add('init:braintree', function() {
    const options:GatewayOptions = {
      environment: braintree.Environment[cfg.BT_ENVIRONMENT],
      merchantId: cfg.BT_MERCHANT_ID,
      publicKey: cfg.BT_PUBLIC_KEY,
      privateKey: cfg.BT_PRIVATE_KEY,
    }

    gateway = braintree.connect(options)
  })

  return 'braintree'
}
