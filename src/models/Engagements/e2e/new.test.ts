import * as test from 'tape-async'
import * as FirebaseServer from 'firebase-server'
import * as Firebase from 'firebase'

import * as Seneca from 'seneca-await'

const server = new FirebaseServer(5000, 'localhost.firebaseio.test', {
  Foo: {
    bar: '123456',
  },
})

import Engagements from '../index'
import sendgrid from '../../../seneca-sendgrid'


'role:Engagements,cmd:create', {
    oppKey: 'oppOne',
    profileKey: 'volTwo',
    uid: 'volTwo',
  }

test('foo', async function(t) {
  const seneca = Seneca()
  seneca.use(Engagements)
  seneca.use(sendgrid, {
    sendgridKey: process.env.SENDGRID_KEY,
  })
  await seneca.act({
    role: 'Engagements',
    cmd: 'create',
    oppKey: 'OPP1',
    profileKey: 'PROFILE1',
    uid: 'UID1',
  })
  t.ok(true)
  // const client = new Firebase('ws://localhost.firebaseio.test:5000')
  // const snap = await client.child('Foo').once('value')
  // t.deepEqual(snap.val(), {bar: '123456'})
})

test.onFinish(() => {
  server.close()
  process.exit()
})
