import {v4} from 'node-uuid'

export function startPing(queueRef:Firebase) {
  const uid = v4()
  const tasksRef:Firebase = queueRef.child('tasks')
  const responseRef:Firebase = queueRef.child('responses').child(uid)
  const waits:any = {}

  function sendPing():Promise<boolean> {
    const key:string = tasksRef.push({
      domain: 'ping',
      action: 'ping',
      payload: {},
      uid
    }).key()

    return new Promise<boolean>(function(resolve, reject) {
      waits[key] = resolve
      setTimeout(() => reject('timeout'), 15000)
    })
  }

  function pingPong() {
    sendPing()
      .then(() => {
        console.log('ping, pong')
      })
      .catch(err => {
        console.error('ping sent, no reply', err)
      })
      .then(() => {
        setTimeout(pingPong, 15000)
      })
  }

  responseRef.on('child_added', function(dataSnapshot:FirebaseDataSnapshot) {
    const key:string = dataSnapshot.key()
    const resolve = waits[key]

    if (resolve) {
      resolve(true)
    }

    responseRef.child(key).remove()
  })

  pingPong()
}


