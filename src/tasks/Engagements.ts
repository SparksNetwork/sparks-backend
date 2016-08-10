import * as assert from 'assert'
import {
  compose, concat, map, pick, prop, sum, propOr,
} from 'ramda'
import {Model} from '../firebase-sn'
import defaults from './defaults'

const SPARKS_RATE = 0.035
const SPARKS_MIN = 1.0

/**
 * Convert a dollar string to dollars
 */
function extractAmount(amount:string | number):number {
  return parseInt(`${amount}`.replace(/[^0-9\.]/g, ''), 10)
}

/**
 * Calculate the sparks portion of the payment
 * 
 * @param {number} payment
 * @param {number} deposit
 * @returns {number}
 */
function calcSparks(payment:number, deposit:number):number {
  if (payment + deposit === 0.0) {
    return 0.0
  } else {
    return (payment + deposit) * SPARKS_RATE + SPARKS_MIN
  }
}

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

/**
 * Calculate the total payable amount from commitments
 * 
 * @param {Commitment[]} commitments
 * @returns {number}
 */
function calcPayment(commitments:Commitment[]):string {
  const paymentComms = commitments.filter(c => c.code === 'payment')
  const depositComms = commitments.filter(c => c.code === 'deposit')
  const payment = compose(sum, map(commitmentAmount))(paymentComms)
  const deposit = compose(sum, map(commitmentAmount))(depositComms)

  return calcPayable(payment, deposit)
}

function Engagements() {
  const seneca = this
  const get:(Spec) => Promise<FulfilledSpec> = spec => seneca.act('role:Firebase,cmd:get', spec)
  const Engagements = Model('Engagements')(seneca)

  this.add({role:'Engagements',cmd:'create'}, async function({oppKey, profileKey}) {
    const {clientToken} = await this.act('role:gateway,cmd:generateClientToken')

    const {key} = await Engagements.push({
      oppKey,
      profileKey,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
      paymentClientToken: clientToken,
    })

    await this.act('role:email,cmd:send,email:engagement', {
      templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
      subject:'New Engagement for',
      profileKey,
      oppKey,
    })

    return {key}
  })

  const removeAssignments = keys => Promise.all(keys.map(key =>
    seneca.act('role:Firebase,model:Assignments,cmd:remove', {key})
  ))

  const updateShiftCounts = keys => Promise.all(keys.map(key =>
    seneca.act({
      role:'Shifts',
      cmd:'updateCounts',
      key,
    })))

  this.add({role:'Engagements',cmd:'remove'}, async function({key}) {
    const {assignments} = await get({assignments: {engagementKey: key}})

    await removeAssignments(assignments.map(prop('$key')))
    await updateShiftCounts(assignments.map(prop('shiftKey')))
    await Engagements.remove(key)

    return {key}
  })

  async function canChangeOpp(engagement, oppKey, userRole) {
    if (userRole !== 'project') { return false }
    if (engagement.isConfirmed) { return false }
    if (engagement.oppKey === oppKey) { return false }

    const {opp: oldOpp} = await get({opp: engagement.oppKey})
    const {opp: newOpp} = await get({opp: oppKey})

    return oldOpp && newOpp && oldOpp.projectKey === newOpp.projectKey
  }

  this.add('role:Engagements,cmd:changeOpp,public$:false', async function({engagement, oppKey}) {
    const {memberships} = await get({memberships: {engagementKey: engagement.$key}})

    await Promise.all(
      concat(
        [this.act('role:Firebase,model:Engagements,cmd:update', {key: engagement.$key, values: {oppKey}})],
        memberships.map(({$key}) =>
          this.act('role:Firebase,model:Memberships,cmd:update', {key: $key, values: {oppKey}})
        )
      )
    )

    return {key: engagement.$key}
  })

  this.add({role:'Engagements',cmd:'update'}, async function({key, values, userRole}) {
    const allowedFields = {
      volunteer: ['answer', 'isAssigned'],
      project: ['answer', 'isAssigned', 'isAccepted', 'priority', 'declined'],
    }[userRole] || []

    await Engagements.update(key, pick<any, any>(allowedFields, values))
    const {engagement} = await get({engagement: key})

    if (values.oppKey && await canChangeOpp(engagement, values.oppKey, userRole)) {
      await this.act('role:Engagements,cmd:changeOpp', {engagement, oppKey: values.oppKey})
    }

    if (values.isAccepted) {
      await this.act('role:Engagements,cmd:sendEmail,email:accepted', {key})
    }

    const {isAssigned, isPaid} = engagement
    const isConfirmed = Boolean(isAssigned && isPaid)
    await Engagements.update(key, {isConfirmed})

    return {key}
  })

  async function makePayment(key:string, nonce:string, amount:string):Promise<boolean> {
    try {
      const {success, transaction} = await seneca.act('role:gateway,cmd:createTransaction', {
        amount,
        nonce,
      })

      await Engagements.update(key, {
          transaction,
          amountPaid: transaction.amount,
          isPaid: success,
          isConfirmed: success,
          paymentError: success ? false : transaction.status,
        })

      return true
    } catch (error) {
      console.log('GATEWAY TRANSACTION ERROR', error)
      await Engagements.update(key, {
        isPaid: false,
        isConfirmed: false,
        paymentError: error.type,
      })
      return false
    }
  }

  this.add({role:'Engagements',cmd:'confirmWithoutPay'}, async function({key, uid}) {
    const {engagement, opp, commitments} = await get({
      engagement: key,
      opp: ['engagement', 'oppKey'],
      commitments: {oppKey: ['engagement', 'oppKey']}
    })

    assert(engagement, 'Engagement does not exist')
    assert(opp, 'Opp does not exist')

    const payment = calcPayment(commitments)

    if (payment !== '0.00') {
      throw new Error(`Cannot no pay, ${payment} due!`)
    }

    await Engagements.update(key, {
      isPaid: true,
      isConfirmed: true,
    })

    // Send the email
    await this.act({role:'Engagements',cmd:'sendEmail',email:'confirmed',key,uid,engagement})

    return {key}
  })

  this.add({role:'Engagements',cmd:'pay'}, async function({key, values}) {
    const {engagement, opp, commitments} = await get({
      engagement: key,
      opp: ['engagement', 'oppKey'],
      commitments: {oppKey: ['engagement', 'oppKey']}
    })

    assert(engagement, 'Engagement does not exist')
    assert(opp, 'Opp does not exist')

    const payment = calcPayment(commitments)
    const result = await makePayment(key, values.paymentNonce, payment)

    if (result) {
      // Send email
      await this.act('role:Engagements,cmd:sendEmail,email:confirmed', {key})
    }

    return {key}
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
    })

    return {key}
  })

  this.add({role:'Engagements',cmd:'updateAssignmentCount'}, async function({key, by}) {
    const {model} = await this.act('role:Firebase,cmd:Model,model:Engagements')
    const ref = model.child(key).child('assignmentCount')
    await ref.transaction(count => (count || 0) + by)
    return {key}
  })
}

export default defaults(Engagements)
