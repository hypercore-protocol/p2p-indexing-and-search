const { Client } = require('hyperspace')
const top = require('process-top')()

start()

async function start () {
  const client = new Client()
  const store = client.corestore()

  const core = store.get({ name: 'first-stats-collector', valueEncoding: 'json' })
  await core.ready()
  console.log('Stats collector key is:', core.key.toString('hex'))

  setInterval(() => {
    core.append(top.toJSON()).catch(err => console.error('Could not append stats'))
  }, 2000)
}
