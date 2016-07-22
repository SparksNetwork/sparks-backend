import {findRecord} from './exporting'

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

