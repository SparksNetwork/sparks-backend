import * as Firebase from 'firebase'

export default function ShiftChanges() {
  async function createShiftChange({uid, shift, assignment}) {
    const {fb} = await this.act('role:Firebase')
    const ref = fb.child('ShiftChanges').child(assignment.engagementKey)

    await ref.child('lastUpdate').transaction(currentData => {
      return Firebase.ServerValue.TIMESTAMP
    })

    const change = ref.push()

    change.set({uid, shift, assignment})
    change.child('created').set(Firebase.ServerValue.TIMESTAMP)

    return change.key()
  }

  this.add('role:ShiftChanges,cmd:create', createShiftChange)
}
