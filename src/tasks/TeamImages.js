import Promise from 'bluebird'

function actions({auths: {userCanUpdateProject}, models: {TeamImages}}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'TeamImages',cmd:'set'}, ({key, uid, values}, respond) => {
    act({role:'Firebase',cmd:'get',
      team: key,
    })
    .then(({team}) =>
      userCanUpdateProject({uid, projectKey: team.projectKey}))
    .then(() =>
      TeamImages.child(key).set(values))
    .then(() => respond(null, {key}))
    .catch(err => respond(err))
  })
}

export default actions
