export function pong() {
  this.add('role:Auth,model:ping,cmd:ping', async function(msg) {
    return {}
  })

  this.add('role:ping,cmd:ping', async function(msg) {
    return {at: Date.now()}
  })

  return 'pong'
}