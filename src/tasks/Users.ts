function action() {
  this.add('role:Users,cmd:migrate', async function({fromUid, toUid, profileKey}) {
    await this.act('role:Firebase,cmd:set,model:Users', {uid: toUid, profileKey})
    await this.act('role:Firebase,cmd:update,model:Profiles', {key: profileKey, values: {uid: toUid}})
    return {key: profileKey}
  })
}

export default action
