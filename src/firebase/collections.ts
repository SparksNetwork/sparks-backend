import {keys, merge} from 'ramda'

interface FirebaseRecord {
  $key:string
  [key:string]:any
}

export function objToRows(obj:any):FirebaseRecord[] {
  return obj && keys(obj).map(key => merge(obj[key], {$key: key})) || []
}

export function byChildKey(root:Firebase) {
  return function(field:string, key:any):Promise<FirebaseRecord[]> {
    console.log('Looking up',field,'of',key)
    return root.orderByChild(field).equalTo(key).once('value')
      .then(snap => objToRows(snap.val()))
  }
}

export function firstByChildKey(root:Firebase) {
  return function(field:string, key:any):Promise<FirebaseRecord> {
    return byChildKey(root)(field,key).then(rows => rows[0])
  }
}

export function byKey(root:Firebase) {
  return function(key:string):Promise<FirebaseRecord> {
    return root.child(key).once('value')
      .then(snap => merge(snap.val(), {$key: key}))
  }
}
