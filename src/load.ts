import senecaSn from './seneca-sn'
import * as Seneca from 'seneca-await'
import cfg from './cfg'

const seneca = Seneca()
const remote = {}

async function load():Promise<any> {
  seneca.use(senecaSn, {cfg, remote})
  await seneca.ready()
  return seneca
}

export {load}
export default load