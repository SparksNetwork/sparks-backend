import {firebase} from './firebase/process-firebase'
import firebaseSn from './firebase/firebase-sn'
import senecaSn from './seneca-sn'
import * as Seneca from 'seneca-await'
import cfg from './cfg'

const seneca = Seneca()
const remote = {}

async function load() {
  console.log('Loading');
  const fb = await firebase()
  seneca.use(firebaseSn, fb)
  seneca.use(senecaSn, {cfg, remote})
  await seneca.ready()
  console.log('Ready');
  return seneca
}

export default load
