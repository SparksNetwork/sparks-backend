import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Engagements, Projects}) =>
  Engagements.push({...values,
    isApplied: true,
    isAccepted: false,
    isConfirmed: false,      
  }).then(ref => ref.key())

const remove = (key, uid, {Profiles, Engagements, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Engagements.get(key),
  ])
  .then(([user, fulfiller]) =>
    Engagements.child(key).remove() && key
  )

const update = ({key, values}, uid, {Engagements}) =>
  Engagements.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}