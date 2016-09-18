import * as express from 'express'
import * as Seneca from 'seneca-await'
import {firebase} from './firebase/process-firebase'
import firebaseSn from './firebase/firebase-sn'
import senecaSn from './seneca-sn'
import cfg from './cfg'
import {startDispatch} from './dispatch'
import {startMetrics} from './metrics'
import {startPing} from "./pingpong/ping";

const app = express()

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(cfg.PORT, () => console.log('Listening on ', cfg.PORT))

const seneca = Seneca({
  // Don't crash it when an error occurs
  debug: {
    undead: true,
  },
  // IF we do not set this then we'd have to rewrite the firebase tasks to wrap
  // the return in an object key/pair
  strict: {result: false},
})

async function start() {
  const fb = await firebase()

  seneca.use(firebaseSn, fb)
  seneca.use(senecaSn, {cfg})
  await seneca.ready()

  console.log('Starting dispatch')
  const queue = startDispatch(fb.child('!queue'), seneca)

  console.log('Starting metrics')
  startMetrics(fb.child('!queue').child('metrics'), fb.child('metrics'))

  console.log('Starting pingpong')
  startPing(fb.child('!queue'))
}

start()
