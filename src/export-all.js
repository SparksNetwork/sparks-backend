import {generateEmailRecords} from './exporting'
console.log('Exporting all engagement records...')
generateEmailRecords(process.env.FIREBASE_HOST)
.then(rows => {
  rows.map(row => console.log(row))
  process.exit()
})
.catch(err => console.log(err))

