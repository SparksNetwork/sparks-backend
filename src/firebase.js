import Firebase from 'firebase'

export default function(cfg, cb) {
  const fb = new Firebase(cfg.FIREBASE_HOST)
  console.log('Connected firebase to', cfg.FIREBASE_HOST)

  fb.authWithCustomToken(cfg.FIREBASE_TOKEN.trim(), err => {
    if (err) { return cb(err) }
    cb(null, fb)
  })

  return fb
}
