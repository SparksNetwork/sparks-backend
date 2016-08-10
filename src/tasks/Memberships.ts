import defaults from './defaults'
import {merge} from 'ramda'

function Memberships() {
  this.add({role:'Memberships',cmd:'create'}, async function({values}):Promise<KeyResponse> {
    return await this.act('role:Firebase,model:Memberships,cmd:push', {values: merge(values, {
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
    })})
  })
}

export default defaults(Memberships, 'remove', 'update')
