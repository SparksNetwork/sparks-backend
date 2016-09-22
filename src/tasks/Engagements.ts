import * as assert from 'assert'
import {
  compose, concat, map, pick, prop, sum, propOr, curry, add, multiply, propEq, find
} from 'ramda'
import {Model, Updater} from '../firebase/firebase-sn'
import defaults from './defaults'
import {test} from "../test/test";
import {
  SubscriptionCreateOptions,
  SubscriptionAddOn,
  Customer, SubscriptionAddOnOptions, SubscriptionUpdateOptions, Subscription
} from "../../typings/braintree";
import {create} from "domain";
import {Test} from "tape-async";
import {debug, error} from "../log";

const SPARKS_RATE = 0.035
const SPARKS_MIN = 1.0

interface Payment {
  payment:string
  deposit:string
}

interface Context extends Updater {
  act: (pattern:string | SenecaPattern, options?: any) => Promise<any>
  get: (spec:Spec) => Promise<any>
}

/**
 * Convert a dollar string to dollars
 */
function extractAmount(amount:string | number):number {
  return parseInt(`${amount}`.replace(/[^0-9\.]/g, ''), 10)
}
test(__filename, 'extractAmount', async function(t) {
  t.equal(extractAmount('10'), 10, 'extracts 10')
  t.equal(extractAmount('17'), 17, 'extracts 17')
  t.equal(extractAmount('10.76'), 10, 'extracts 10')
  t.equal(extractAmount('$10'), 10, 'extracts $10')
  t.equal(extractAmount('$15'), 15, 'extracts $15')
  t.equal(extractAmount('$10.76'), 10, 'extracts $10')
  t.equal(extractAmount('$0.00'), 0, 'extracts $0.00')
})

const chopFloat = curry((chop, amount:number) =>
  Number(amount.toFixed(chop))
)

/**
 * Add sparks portion of payment
 * @type {(x0:number)=>number}
 */
const addSparks = compose(
  chopFloat(3),
  add(SPARKS_MIN),
  multiply(SPARKS_RATE)
)

/**
 * Calculate the sparks portion of the payment
 * 
 * @param {number} payment
 * @param {number} deposit
 * @returns {number}
 */
function calcSparks(payment:number, deposit:number):number {
  const total = payment + deposit

  if (total === 0.0) {
    return 0.0
  } else {
    return addSparks(total)
  }
}
test(__filename, 'calcSparks', async function(t) {
  t.equal(calcSparks(0, 0), 0.0)
  t.equal(calcSparks(1, 0), 1.035)
  t.equal(calcSparks(0, 1), 1.035)
  t.equal(calcSparks(2, 0), 1.07)
  t.equal(calcSparks(2, 2), 1.14)
})

const commitmentAmount:(Commitment) => number =
  compose<Commitment, number | string, number>(
    extractAmount, propOr(0, 'amount'))

/**
 * Calculate the total payable amount from the payment and deposit
 * 
 * @param {number} payment
 * @param {number} deposit
 * @returns {number}
 */
function calcPayable(payment:number, deposit:number):string {
  return (payment + calcSparks(payment, deposit)).toFixed(2)
}
test(__filename, 'calcPayable', async function(t) {
  t.equal(calcPayable(0, 0), '0.00', '0 + 0 = 0.00')
  t.equal(calcPayable(1, 0), '2.04', '1 + 0 = 2.04')
  t.equal(calcPayable(1, 1), '2.07', '1 + 1 = 2.07')
  t.equal(calcPayable(0, 1), '1.03', '0 + 1 = 1.03')
  t.equal(calcPayable(2, 0), '3.07', '2 + 0 = 3.07')
  t.equal(calcPayable(2, 2), '3.14', '2 + 2 = 3.14')
})

/**
 * Calculate the total payable amount from commitments
 * 
 * @param {Commitment[]} commitments
 * @returns {number}
 */
function calcPayment(commitments:{code?:string, amount?:string}[]):Payment {
  const paymentCommitments = commitments.filter(c => c.code === 'payment')
  const depositCommitments = commitments.filter(c => c.code === 'deposit')
  const payment = compose(sum, map(commitmentAmount))(paymentCommitments)
  const deposit = compose(sum, map(commitmentAmount))(depositCommitments)

  const payNow = calcPayable(payment, deposit)

  return {
    payment: payNow,
    deposit: deposit.toFixed(2)
  }
}
test(__filename, 'calcPayment', async function(t) {
  const com1p = {code: 'payment', amount: '$1'}
  const com1d = {code: 'deposit', amount: '$1'}
  const com2p = {code: 'payment', amount: '$30'}
  const com2d = {code: 'deposit', amount: '$150'}

  t.deepEqual(calcPayment([]), {payment: '0.00', deposit: '0.00'})
  t.deepEqual(calcPayment([com1p]), {payment: '2.04', deposit: '0.00'})
  t.deepEqual(calcPayment([com1d]), {payment: '1.03', deposit: '1.00'})
  t.deepEqual(calcPayment([com1d, com1p]), {payment: '2.07', deposit: '1.00'})
  t.deepEqual(calcPayment([com2p, com2d]), {payment: '37.30', deposit: '150.00'})
})

async function generateClientToken(this:Context, profileKey:string):Promise<{clientToken:string, gatewayId:string}> {
  const gatewayCustomer:Customer = await this.act('role:GatewayCustomers,cmd:get', {profileKey})
  const response = await this.act('role:gateway,cmd:generateClientToken', {
    options: {customerId: gatewayCustomer.id}
  })
  return {
    clientToken: response.clientToken,
    gatewayId: gatewayCustomer.id
  }
}

async function removeAssignments(keys:string[]) {
  return await Promise.all(keys.map(key =>
    this.act('role:Firebase,model:Assignments,cmd:remove', {key})
  ))
}

async function updateShiftCounts(keys:string[]) {
  return await Promise.all(keys.map(key =>
    this.act({
      role:'Shifts',
      cmd:'updateCounts',
      key,
    })
  ))
}

async function ensureEngagementHasToken(this:Context, key:string) {
  const {engagement} = await this.get({engagement:key})
  if (engagement.payment) { return }
  if (engagement.isPaid) { return }
  const token = await generateClientToken.call(this, engagement.profileKey)
  await this.child(key).update('payment', token)
}
test(__filename, 'ensureEngagementHasToken', async function(t:Test) {
  const spy = require('sinon').spy
  const engWithGatewayId = {payment: {gatewayId: 'abc123'}}
  const engIsPaid = {isPaid: true}
  const engWithoutGatewayId = {profileKey: 'dec234'}
  const context:any = {}
  const updater = {update: spy()}

  context.get = () => Promise.resolve({engagement: engWithGatewayId})
  context.act = spy(() => Promise.resolve({}))
  context.child = spy(() => updater)
  await ensureEngagementHasToken.call(context, 'abc123')
  t.equal(context.child.callCount, 0, 'early exit')

  context.get = () => Promise.resolve({engagement: engIsPaid})
  context.act = spy()
  context.update = spy()
  await ensureEngagementHasToken.call(context, 'abc123')
  t.equal(context.child.callCount, 0, 'early exit')

  context.get = () => Promise.resolve({engagement: engWithoutGatewayId})
  context.act = spy(async function(cmr):Promise<any> {
    switch(cmr) {
      case 'role:GatewayCustomers,cmd:get':
        return {id: 'gwid'}
      case 'role:gateway,cmd:generateClientToken':
        return {clientToken: 'cli'}
    }
  })
  await ensureEngagementHasToken.call(context, 'abc123')
  t.equal(context.act.callCount, 2, 'all the acts')
  t.equal(context.child.getCall(0).args[0], 'abc123')
  t.equal(updater.update.callCount, 1, 'updates the engagement')
  t.equal(updater.update.getCall(0).args[0], 'payment')
  t.deepEqual(updater.update.getCall(0).args[1], {
    clientToken: 'cli',
    gatewayId: 'gwid'
  })
})

async function canChangeOpp(this:Context, engagement, oppKey, userRole) {
  if (userRole !== 'project') { return false }
  if (engagement.isConfirmed) { return false }
  if (engagement.oppKey === oppKey) { return false }

  const {opp: oldOpp} = await this.get({opp: engagement.oppKey})
  const {opp: newOpp} = await this.get({opp: oppKey})

  return oldOpp && newOpp && oldOpp.projectKey === newOpp.projectKey
}

async function updateEngagement(this:Context, key:string, values:any, userRole:string) {
  await ensureEngagementHasToken.call(this, key)

  const allowedFields = {
      volunteer: ['answer', 'isAssigned', 'isApplied'],
      project: ['answer', 'isAssigned', 'isAccepted', 'isApplied', 'priority', 'declined'],
    }[userRole] || []

  await this.update(key, pick<any, any>(allowedFields, values))
  const {engagement} = await this.get({engagement: key})

  if (values.oppKey && await canChangeOpp.call(this, engagement, values.oppKey, userRole)) {
    await this.act('role:Engagements,cmd:changeOpp', {
      engagement,
      oppKey: values.oppKey
    })
  }

  if (values.isAccepted) {
    await this.act('role:Engagements,cmd:sendEmail,email:accepted', {key})
  }

  if (values.isApplied) {
    await this.act('role:email,cmd:send,email:engagement', {
      templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
      subject: 'You\'ve Applied to',
      profileKey: engagement.profileKey,
      oppKey: engagement.oppKey,
    })
  }

  const {isAssigned, isPaid} = engagement
  const isConfirmed = Boolean(isAssigned && isPaid)
  await this.update(key, {isConfirmed})

  return {key}
}

async function makePayment(this:Context, key:string, nonce:string, payment:Payment):Promise<boolean> {
  try {
    const paymentAddon:SubscriptionAddOn = {
      amount: payment.payment,
      quantity: 1,
      inheritedFromId: 'payment'
    }

    const options:SubscriptionCreateOptions = {
      options: {
        startImmediately: true,
        doNotInheritAddOnsOrDiscounts: true
      },
      neverExpires: true,
      paymentMethodNonce: nonce,
      planId: 'event',
      price: '0.00',
      addOns: {
        add: [paymentAddon]
      }
    }

    debug('creating subscription', options)
    const {success, subscription} = await this.act('role:gateway,cmd:createSubscription', {options})
    debug('subscription response', success, subscription)
    const transaction = subscription.transactions[0]

    await this.update(key, {
      amountPaid: transaction.amount,
      depositAmount: payment.deposit,
      isPaid: success,
      isConfirmed: success
    })

    await this.child(key).update('payment', {
      amountPaid: transaction.amount,
      paidAt: Date.now(),
      subscriptionId: subscription.id,
      transactionId: transaction.id,
      paymentError: success ? false : (transaction ? transaction.status : 'error')
    })

    return true
  } catch (err) {
    error('GATEWAY TRANSACTION ERROR', err)
    await this.update(key, {
      isPaid: false,
      isConfirmed: false,
      paymentError: err.type,
    })
    return false
  }
}

async function createEngagement(this:Context, oppKey, profileKey) {
  // Check to make sure the engagement is unique
  const {engagements} = await this.get({engagements: {profileKey}})
  const engagement = find(propEq('oppKey', oppKey), engagements)
  if (engagement) { return {key: engagement.key} }

  // Get the payment token from braintree
  const token = await generateClientToken.call(this, profileKey)

  const {key} = await this.push({
    oppKey,
    profileKey,
    isApplied: false,
    isAccepted: false,
    isConfirmed: false,
    payment: token
  })

  return {key}
}
test(__filename, 'createEngagement', async function(t:Test) {
  const spy = require('sinon').spy
  const context = {} as any

  context.get = spy(() => Promise.resolve({engagements: []}))
  context.act = spy(() => Promise.resolve({id: '1', clientToken: 'token'}))
  context.push = spy(() => Promise.resolve({key: 'created'}))
  t.deepEqual(
    await createEngagement.call(context, 'abc123', '123abc'),
    {key: 'created'}
  )
  t.equal(context.push.callCount, 1)
  t.deepEqual(context.push.getCall(0).args[0], {
    oppKey: 'abc123',
    profileKey: '123abc',
    isApplied: false,
    isAccepted: false,
    isConfirmed: false,
    payment: {
      clientToken: 'token',
      gatewayId: '1'
    }
  })

  // Engagement already exists
  context.get = spy(() => Promise.resolve({engagements: [{key: '234bde', oppKey: 'abc123'}]}))
  context.push = spy()
  context.act = spy()
  await createEngagement.call(context, 'abc123', '123abc')
  t.equal(context.push.callCount, 0)

  // Unequal engagement exists
  context.get = spy(() => Promise.resolve({engagements: [{key: '234bde', oppKey: 'dce123'}]}))
  context.act = spy(() => Promise.resolve({id: 1}))
  context.push = spy(() => Promise.resolve({key: 'created'}))
  await createEngagement.call(context, 'abc123', '123abc')
  t.equal(context.push.callCount, 1)
})

async function removeEngagement(this:Context, key:string) {
  const {assignments} = await this.get({assignments: {engagementKey: key}})

  await removeAssignments.call(this, assignments.map(prop('$key')))
  await updateShiftCounts.call(this, assignments.map(prop('shiftKey')))
  await this.remove(key)

  return {key}
}


async function changeOpp(this:Context, engagement, oppKey) {
  const {memberships} = await this.get({memberships: {engagementKey: engagement.$key}})

  await Promise.all(
    concat(
      [this.act('role:Firebase,model:Engagements,cmd:update', {
        key: engagement.$key,
        values: {oppKey}
      })],
      memberships.map(({$key}) =>
        this.act('role:Firebase,model:Memberships,cmd:update', {
          key: $key,
          values: {oppKey}
        })
      )
    )
  )

  return {key: engagement.$key}
}

async function confirmWithoutPay(this:Context, uid, key) {
  const {engagement, opp, commitments} = await this.get({
    engagement: key,
    opp: ['engagement', 'oppKey'],
    commitments: {oppKey: ['engagement', 'oppKey']}
  })

  assert(engagement, 'Engagement does not exist')
  assert(opp, 'Opp does not exist')

  const payment = calcPayment(commitments)

  if (payment.payment !== '0.00') {
    throw new Error(`Cannot no pay, ${payment} due!`)
  }

  await this.update(key, {
    amountPaid: '0.00',
    isPaid: true,
    isConfirmed: true,
  })
  await this.child(key).update('payment', {
    amountPaid: '0.00',
    paidAt: Date.now()
  })

  // Send the email
  await this.act('role:Engagements,cmd:sendEmail,email:confirmed', {key,uid,engagement})

  return {key}
}

async function payEngagement(this:Context, key, values) {
  debug('payEngagement', key, values)

  const {engagement, opp, commitments} = await this.get({
    engagement: key,
    opp: ['engagement', 'oppKey'],
    commitments: {oppKey: ['engagement', 'oppKey']}
  })

  assert(engagement, 'Engagement does not exist')
  assert(opp, 'Opp does not exist')

  const payment = calcPayment(commitments)
  const result = await makePayment.call(this, key, values.paymentNonce, payment)

  if (result) {
    // Send email
    await this.act('role:Engagements,cmd:sendEmail,email:confirmed', {key})
  }

  return {key}
}

async function reclaimEngagement(this:Context, key:string) {
  const {engagement} = await this.get({engagement: key})
  assert(engagement, 'Engagement does not exist')
  assert(!engagement.isDepositPaid, 'Deposit already paid')

  const {payment, depositAmount} = engagement
  assert(payment, 'Engagement is not paid')
  assert(payment.subscriptionId, 'No subscription found')
  assert(depositAmount, 'No deposit amount found')

  // Return if the deposit amount is < $1
  if (extractAmount(depositAmount) === 0) { return {key} }

  const depositAddOn:SubscriptionAddOn = {
    amount: depositAmount,
    inheritedFromId: 'deposit'
  }

  const options:SubscriptionUpdateOptions = {
    addOns: {
      add: [depositAddOn]
    }
  }

  const response = await this.act('role:gateway,cmd:updateSubscription', {
    id: payment.subscriptionId,
    options
  })
  debug('retain, braintree response', response)

  const subscription:Subscription = response.subscription

  if (response.success) {
    await this.update(key, {
      isDepositPaid: true,
      deposit: {
        billingDate: subscription.nextBillingDate
      }
    })
  } else {
    await this.update(key, {
      isDepositPaid: false,
      deposit: {
        paymentError: response.message || 'unknown'
      }
    })
  }

  return {key}
}

function Engagements() {
  const act = this.act.bind(this)
  const get:(Spec) => Promise<FulfilledSpec> = spec => act('role:Firebase,cmd:get', spec)
  const Engagements = Model('Engagements')(this)
  const context = Object.assign(Engagements, {act, get}) as Context

  this.add({role:'Engagements',cmd:'create'}, async function({oppKey, profileKey}) {
    return await createEngagement.call(context, oppKey, profileKey)
  })

  this.add({role:'Engagements',cmd:'remove'}, async function({key}) {
    return await removeEngagement.call(context, key)
  })

  this.add('role:Engagements,cmd:changeOpp,public$:false', async function({engagement, oppKey}) {
    return await changeOpp.call(context, engagement, oppKey)
  })

  this.add({role:'Engagements',cmd:'update'}, async function({key, values, userRole}) {
    return await updateEngagement.call(context, key, values, userRole)
  })

  this.add({role:'Engagements',cmd:'confirmWithoutPay'}, async function({uid, key}) {
    return await confirmWithoutPay.call(context, uid, key)
  })

  this.add({role:'Engagements',cmd:'pay'}, async function({key, values}) {
    return await payEngagement.call(context, key, values)
  })

  this.add('role:Engagements,cmd:reclaim', async function({key}) {
    return await reclaimEngagement.call(context, key)
  })

  this.add('role:Engagements,cmd:sendEmail,email:accepted', async function({key}) {
    const {engagement, opp} = await get({engagement: key, opp: ['engagement', 'oppKey']})
    assert(engagement, 'Engagement not found')

    if (opp.confirmationsOn) {
      await this.act({
        role:'email',
        cmd:'send',
        email:'engagement',
        templateId:'dec62dab-bf8e-4000-975a-0ef6b264dafe',
        subject:'Application accepted for',
        profileKey: engagement.profileKey,
        oppKey: engagement.oppKey,
        key,
      })
    }

    return {engagement}
  })

  this.add({role:'Engagements',cmd:'sendEmail',email:'confirmed'}, async function({key}) {
    const {engagement} = await get({engagement: key})

    assert(engagement, 'Engagement not found')

    await this.act({
      role:'email',
      cmd:'send',
      email:'engagement',
      subject: 'Your are confirmed for',
      templateId: 'b1180393-8841-4cf4-9bbd-4a8602a976ef',
      profileKey: engagement.profileKey,
      oppKey: engagement.oppKey,
      key,
    })

    return {key}
  })

  this.add({role:'Engagements',cmd:'updateAssignmentCount'}, async function({key, by}) {
    await this.act('role:Firebase,cmd:inc,model:Engagements,child:assignmentCount', {
      key, by
    })
    return {key}
  })
}

export default defaults(Engagements)
