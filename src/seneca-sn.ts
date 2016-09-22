import firebaseGet from './firebase/firebase-get'
import braintree from './braintree'
import auth from './auth'
import tasks from './tasks'
import email from './email'
import {pong} from './pingpong/pong';

export default function({cfg}) {
  const seneca = this
  seneca.use(firebaseGet)
  seneca.use(email)
  seneca.use(braintree, cfg)
  seneca.use(tasks, {})
  seneca.use(auth)
  seneca.use(pong)

  return 'sn'
}
