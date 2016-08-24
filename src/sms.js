import Twilio from 'twilio'
import csv from 'fast-csv'

const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function call(row) {
  const [profileKey, name, email, phone, engKey, status, opp] = row
  console.log('calling', name, phone)
  const response = await twilio.messages.create({
    body: 'Hi ' + name + '  Grab your shifts for Bhakti Fest West while there are still some left!  Log in to http://sparks.network with a computer.  If you have questions or need to withdraw, email help@sparks.network.',
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
  console.log('response', response)
}

async function fakeCall(row) {
  const [profileKey, name, email, phone, engKey, status, opp] = row
  console.log('calling', name, phone)
}

const filename = process.argv[2]
console.log('opening', filename)
csv
.fromPath(filename)
.on('data', call)
// .on('data', fakeCall)
.on('end', () => console.log('done'))
