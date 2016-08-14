import Twilio from 'twilio'
import csv from 'fast-csv'

const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function call(row) {
  const [profileKey, name, email, phone, engKey, status, opp] = row
  console.log('calling', name, phone)
  const response = await twilio.messages.create({
    body: 'HURRY! Confirm your Dirtybird BBQ volunteer spot for tomorrow! Go to http://sparks.network to lock in your spot, or e-mail help@sparks.network to cancel and stop our texts.',
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
  console.log('response', response)
}

// async function fakeCall(row) {
//   const [profileKey, name, email, phone, engKey, status, opp] = row
//   console.log('calling', name, phone)
// }

const filename = process.argv[2]
console.log('opening', filename)
csv
.fromPath(filename)
.on('data', call)
.on('end', () => console.log('done'))
