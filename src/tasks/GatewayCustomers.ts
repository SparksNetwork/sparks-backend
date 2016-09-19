import {
  CustomerResponse, CustomerOptions,
  Customer
} from "../../typings/braintree-node";
import {Model} from "../firebase/firebase-sn";
import {
  compose, prop, head, last, split, applySpec
} from 'ramda'
import {test} from "../test/test";
import {Test} from "tape-async";

const makeCustomerOptions:(profile:Profile) => CustomerOptions = applySpec({
  email: prop('email'),
  firstName: compose<Profile, string, string[], string>(head, split(' '), prop('fullName')),
  lastName: compose<Profile, string, string[], string>(last, split(' '), prop('fullName'))
})
test(__filename, 'makeCustomerOptions', async function(t:Test) {
  t.deepEqual(makeCustomerOptions({
    fullName: 'Jeremy David Wells',
    email: 'jwells@example.com'
  } as Profile), {
    email: 'jwells@example.com',
    firstName: 'Jeremy',
    lastName: 'Wells'
  })
})

async function getGatewayCustomer(seneca:Seneca, id:string):Promise<Customer> {
  const response = await seneca.act('role:gateway,cmd:findCustomer', {id})
  if (!response.success) { throw new Error(response.message) }
  return response.customer
}

async function createGatewayCustomer(seneca:Seneca, profile:Profile) {
  const options = makeCustomerOptions(profile)
  const response:CustomerResponse = await seneca.act('role:gateway,cmd:createCustomer', {options})
  if (!response.success) { throw new Error(response.message) }

  return response.customer
}

function GatewayCustomers() {
  const seneca = this
  const Profiles = Model('Profiles')(seneca)
  const model = Model('GatewayCustomers')(seneca)
  const get = spec => seneca.act('role:Firebase,cmd:get', spec)

  this.add('role:GatewayCustomers,cmd:get', async function({profileKey}) {
    const {profile, gateway_customer} = await get({
      profile: profileKey,
      gateway_customer: {profileKey}
    })

    if (gateway_customer) {
      return await getGatewayCustomer(seneca, gateway_customer.gatewayId)
    } else {
      const customer = await createGatewayCustomer(seneca, profile)

      await model.push({
        profileKey,
        gatewayId: customer.id
      })

      return customer
    }
  })
}

export default GatewayCustomers
