import * as test from 'tape-async'
import * as FirebaseServer from 'firebase-server'
import * as Firebase from 'firebase'

import * as Seneca from 'seneca-await'

const server = new FirebaseServer(5000, 'localhost.firebaseio.test', {
  Profiles: {
    PROFILE1: {
      fullName: 'Bob Dobbs'
    }
  },
})

import Engagements from '../index'
import sendgrid from '../../../seneca-sendgrid'
import braintree from '../../../seneca-braintree'
import firebase from '../../../seneca-firebase'
import firebaseGet from '../../../firebase-get'

test('Engagements:create', async function(t) {
  const seneca = Seneca()
  seneca.use(Engagements)
  seneca.use(sendgrid, {
    sendgridKey: process.env.SENDGRID_KEY,
  })
  seneca.use(braintree, {
    environment: process.env.BT_ENVIRONMENT,
    merchantId: process.env.BT_MERCHANT_ID,
    publicKey: process.env.BT_PUBLIC_KEY,
    privateKey: process.env.BT_PRIVATE_KEY,
  })
  seneca.use(firebase, {
    firebaseHost: 'ws://localhost.firebaseio.test:5000',
  })
  seneca.use(firebaseGet)

  await seneca.act({
    role: 'Engagements',
    cmd: 'create',
    oppKey: 'OPP1',
    profileKey: 'PROFILE1',
    uid: 'UID1',
  })
  console.log(await server.getValue())
  t.ok(true)
  // const client = new Firebase('ws://localhost.firebaseio.test:5000')
  // const snap = await client.child('Foo').once('value')
  // t.deepEqual(snap.val(), {bar: '123456'})
})

test.onFinish(() => {
  server.close()
  process.exit()
})
