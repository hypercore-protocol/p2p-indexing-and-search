// This file should be launched with the node, because we want to make sure our process stats
// are saved to disk (hyperspace-simulator runs in-memory only).
//
// Make sure Hyperspace is running, then do:
//
// `node peer-one.js`

// Start this file before running peer-two.js!

const { Client } = require('hyperspace')
const top = require('process-top')()

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ name: 'first-stats-collector', valueEncoding: 'json' })
  await core.ready()
  console.log('Stats collector key is:', core.key.toString('hex'))

  await replicate(core)

  setInterval(() => {
    core.append(top.toJSON()).catch(err => console.error('Could not append stats'))
  }, 2000)
}
