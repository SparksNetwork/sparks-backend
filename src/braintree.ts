const braintree = require('braintree-node')
import {merge} from 'ramda'
import {Gateway} from "../typings/braintree-node";

export default function(cfg) {
  let gateway:Gateway

  this.add('role:gateway', async function(msg) {
    return await gateway[msg.cmd](msg.options)
  })

  this.add('role:gateway,cmd:createCustomer', async function({customer}) {
    return await gateway.createCustomer(customer)
  })

  this.add('role:gateway,cmd:createMultipleCustomers', async function({customers}) {
    return await gateway.createMultipleCustomers(customers)
  })

  this.add('role:gateway,cmd:deleteCustomer', async function({id}) {
    return await gateway.deleteCustomer(id)
  })

  this.add('role:gateway,cmd:deleteMultipleCustomers', async function({customers}) {
    return await gateway.deleteMultipleCustomers(customers)
  })

  this.add('role:gateway,cmd:findCustomer', async function({id}) {
    return await gateway.findCustomer(id)
  })

  this.add('role:gateway,cmd:findOneAndUpdate', async function({id, update, upsert}) {
    return await gateway.findOneAndUpdate(id, update, upsert || false)
  })

  this.add('role:gateway,cmd:updateCustomer', async function({id, update}) {
    return await gateway.updateCustomer(id, update)
  })

  this.add('role:gateway,cmd:createTransaction', async function({options}) {
    return await gateway.createTransaction(options)
  })

  this.add('role:gateway,cmd:cloneTransaction', async function({id, amount, submitForSettlement}) {
    return await gateway.cloneTransaction(id, amount, submitForSettlement)
  })

  this.add('role:gateway,cmd:generateClientToken', async function({options}) {
    return await gateway.generateClientToken(options || {})
  })

  this.add('role:gateway,cmd:createSubscription', async function({options}) {
    return await gateway.createSubscription(options)
  })

  this.add('role:gateway,cmd:findSubscription', async function({id}) {
    return await gateway.findSubscription(id)
  })

  this.add('role:gateway,cmd:cancelSubscription', async function({id}) {
    return await gateway.cancelSubscription(id)
  })

  this.wrap('role:gateway', async function(msg) {
    const result = await this.prior(msg)
    console.log('[braintree]', result.success, result)
    return result
  })

  this.add('init:braintree', function() {
    gateway = braintree({
      environment: cfg.BT_ENVIRONMENT,
      merchantId: cfg.BT_MERCHANT_ID,
      publicKey: cfg.BT_PUBLIC_KEY,
      privateKey: cfg.BT_PRIVATE_KEY,
    })
  })

  return 'braintree'
}
