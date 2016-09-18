import * as Firebase from 'firebase'
import * as assert from 'assert'

function firebase():Promise<Firebase> {
  const FIREBASE_HOST:string = process.env.FIREBASE_HOST
  const FIREBASE_TOKEN:string = process.env.FIREBASE_TOKEN

  assert(FIREBASE_HOST, 'pass FIREBASE_HOST')
  assert(FIREBASE_TOKEN, 'pass FIREBASE_TOKEN')

  const fb = new Firebase(FIREBASE_HOST)

  return new Promise<Firebase>((resolve, reject) => {
    fb.authWithCustomToken(FIREBASE_TOKEN.trim(), err => {
      if (err) {
        return reject(err)
      }
      resolve(fb)
    })
  })
}

export {firebase}