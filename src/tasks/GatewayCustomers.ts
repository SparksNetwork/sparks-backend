import {
  CustomerResponse, CustomerOptions,
  Customer
} from "../../typings/braintree";
import {Model} from "../firebase/firebase-sn";
import {
  compose, prop, head, last, split, applySpec, merge, not, whereEq
} from 'ramda'
import {test} from "../test/test";
import {Test} from "tape-async";
import {debug} from "../log";

const makeCustomerOptions:(profile:Profile) => CustomerOptions = applySpec({
  email: prop('email'),
  firstName: compose<Profile, string, string[], string>(head, split(' '), prop('fullName')),
  lastName: compose<Profile, string, string[], string>(last, split(' '), prop('fullName')),
  phone: prop('phone')
})
test(__filename, 'makeCustomerOptions', async function(t:Test) {
  t.deepEqual(makeCustomerOptions({
    fullName: 'Jeremy David Wells',
    email: 'jwells@example.com',
    phone: '+64'
  } as Profile), {
    email: 'jwells@example.com',
    firstName: 'Jeremy',
    lastName: 'Wells',
    phone: '+64'
  })
})

async function updateCustomerIfRequired(profile:Profile, customer:Customer) {
  const options = makeCustomerOptions(profile)

  if(not(whereEq(options, customer))) {
    await this.act('role:gateway,cmd:updateCustomer', {id: customer.id, options})
  }
}
test(__filename, 'updateCustomerIfRequired', async function(t:Test) {
  const spy = require('sinon').spy
  const context:any = {}
  let act
  const existingCustomer = {
    id: 'abc123',
    firstName: 'Jeremy',
    lastName: 'Wells',
    email: 'jeremy@example.com'
  }

  act = context.act = spy()
  updateCustomerIfRequired.call(context, {
    fullName: 'Jeremy Wells',
    email: 'jeremy@example.com'
  }, existingCustomer)
  t.equal(act.callCount, 0, 'no update when no changes')

  act = context.act = spy()
  updateCustomerIfRequired.call(context, {
    fullName: 'Jomery Walls',
    email: 'jeremy@example.com'
  }, existingCustomer)
  t.equal(act.callCount, 1, '1 call')
  t.equal(act.getCall(0).args[0], 'role:gateway,cmd:updateCustomer')
  t.deepEqual(act.getCall(0).args[1], {id: 'abc123', options: {
    email: 'jeremy@example.com',
    firstName: 'Jomery',
    lastName: 'Walls',
    phone: undefined
  }}, 'updates customer')

  act = context.act = spy()
  updateCustomerIfRequired.call(context, {
    fullName: 'Jeremy Wells',
    email: 'jeremy@example.com',
    phone: '+644123456'
  }, existingCustomer)
  t.equal(act.callCount, 1, '1 call')
  t.equal(act.getCall(0).args[0], 'role:gateway,cmd:updateCustomer')
  t.deepEqual(act.getCall(0).args[1], {id: 'abc123', options: {
    email: 'jeremy@example.com',
    firstName: 'Jeremy',
    lastName: 'Wells',
    phone: '+644123456'
  }}, 'updates customer')
})


async function createGatewayCustomer(profile:Profile) {
  const options = makeCustomerOptions(profile)
  const response:CustomerResponse = await this.act('role:gateway,cmd:createCustomer', {options})
  debug('create gw customer', response)
  if (!response.success) { throw new Error(response.message) }
  return response.customer
}

async function getOrCreateGatewayCustomer(profileKey:string) {
  const {profile, gateway_customer} = await this.get({
    profile: profileKey,
    gateway_customer: {profileKey}
  })

  let customer:Customer = gateway_customer &&
    await this.act('role:gateway,cmd:findCustomer', {id: gateway_customer.gatewayId})

  if (customer) {
    updateCustomerIfRequired.call(this, profile, customer)
  } else {
    customer = await createGatewayCustomer.call(this, profile)

    if (gateway_customer) {
      await this.update(gateway_customer.$key, {gatewayId: customer.id})
    } else {
      await this.push({
        profileKey,
        gatewayId: customer.id
      })
    }
  }

  return customer
}

function GatewayCustomers() {
  const act = this.act.bind(this)
  const Profiles = Model('Profiles')(this)
  const model = Model('GatewayCustomers')(this)
  const get = spec => act('role:Firebase,cmd:get', spec)
  const context = merge({act, get}, model)

  this.add('role:GatewayCustomers,cmd:get', async function({profileKey}) {
    return await getOrCreateGatewayCustomer.call(context, profileKey)
  })
}

export default GatewayCustomers
