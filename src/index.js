import express from 'express'
import Firebase from 'firebase'
import senecaTasks from './seneca-tasks'
import braintree from 'braintree-node'
import Seneca from 'seneca'
import {startDispatch} from './dispatch'

const requiredVars = [
  'FIREBASE_HOST',
  'FIREBASE_TOKEN',
  'BT_ENVIRONMENT',
  'BT_MERCHANT_ID',
  'BT_PUBLIC_KEY',
  'BT_PRIVATE_KEY',
  'SENDGRID_KEY',
  'DOMAIN',
  'PORT',
]

const cfg = {}

requiredVars.forEach(v => {
  if (process.env[v]) {
    cfg[v] = process.env[v].trim()
  } else {
    console.log('Must specify ' + v)
    process.exit()
  }
})

const app = express()
const remote = {}

app.get('/', (req,res) => res.send('Hello World!'))
app.listen(cfg.PORT, () => console.log('Listening on ',cfg.PORT))

remote.gateway = braintree({
  environment: cfg.BT_ENVIRONMENT,
  merchantId: cfg.BT_MERCHANT_ID,
  publicKey: cfg.BT_PUBLIC_KEY,
  privateKey: cfg.BT_PRIVATE_KEY,
})

const fb = new Firebase(cfg.FIREBASE_HOST)
console.log('Connected firebase to', cfg.FIREBASE_HOST)

const seneca = Seneca({
  debug: {
    undead: true,
  },
})
seneca.use(senecaTasks, {fb, remote})

fb.authWithCustomToken(cfg.FIREBASE_TOKEN.trim(), err => {
  if (err) {
    console.log('FB Auth err:',err)
    process.exit()
  }

  console.log('Authenticated to firebase')

  seneca.ready(err => {
    if (err) {
      console.log('Seneca err:', err)
      process.exit()
    }

    console.log('Starting dispatch')
    startDispatch(fb.child('!queue'), seneca)
  })
})
