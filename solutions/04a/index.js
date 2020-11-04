const { Client } = require('hyperspace')

const STATS_CORE_KEY = '(your key from the previous exercise)'

start()

async function start () {
  const { corestore, network, replicate } = new Client()
  const store = corestore()

  // Get the stats core.
  const statsCore = store.get({ key: STATS_CORE_KEY, valueEncoding: 'json' })
  await statsCore.ready()

  // Print the last block from the stats core.
  const lastBlock = await statsCore.get(statsCore.length - 1)
  console.log(lastBlock)
}
