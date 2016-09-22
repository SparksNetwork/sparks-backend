import {objToRows} from '../firebase/collections'
import * as Firebase from 'firebase'

function booleanFromString(value) {
  if (value === 'true') { return true }
  if (value === 'false') { return false }
  return value
}

async function findRecord(host, collection, field, value) {
  const fb = new Firebase(host)
  const lookup = () =>
    fb.child(collection)
      .orderByChild(field)
      .equalTo(booleanFromString(value))
      .once('value')
      .then(snap => snap.val())
  const recs = await lookup()
  console.log('recs', recs)
  return objToRows(recs)
}

console.log(process.argv)

const [coll, field, val] = [process.argv[2], process.argv[3], process.argv[4]]

findRecord(process.env.FIREBASE_HOST, coll, field, val)
.then(rows => {
  rows.map(row => console.log(row))
  process.exit()
})
.catch(err => {
  console.log(err)
  process.exit()
})

