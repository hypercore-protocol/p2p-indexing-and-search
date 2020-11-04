const { Client } = require('hyperspace')
const top = require('process-top')()

start()

async function start () {
  const client = new Client()
  const corestore = client.corestore()

  const core = corestore.get({ name: 'first-stats-collector', valueEncoding: 'json' })
  await core.ready()
  console.log('Stats collector key is:', core.key.toString('hex'))

  await client.network.configure(core.discoveryKey, {
    announce: true,
    lookup: false
  })

  setInterval(() => {
    core.append(top.toJSON()).catch(err => console.error('Could not append stats'))
  }, 2000)
}
