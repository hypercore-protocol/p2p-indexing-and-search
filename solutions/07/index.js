// Run this file with the hyperspace-simulator
// hyperspace-simulator index.js

const { Client } = require('hyperspace')
const top = require('process-top')()

start()

async function start () {
  const { corestore } = new Client()
  const store = corestore()

  const core = store.get({ name: 'stats-embedded-index', valueEncoding: 'json' })
  await core.ready()

  setInterval(async () => {
    const stats = top.toJSON()
    const index = await buildNextIndex(core)
    core.append({ stats, index }).catch(err => console.error('Could not append stats'))
  }, 500)

  console.log('Waiting 5s for some stats to be appended.')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Get the stats from ~2.5s ago.
  const stats = await findClosest(core, new Date(Date.now() - (2.5 * 1e3)))
  console.log('Stats from ~2.5s ago:', stats)
}

async function createDataset (core, pairs) {
  let idx = 0
  for (const pair of pairs) {
    const index = await buildNextIndex(core)
    await core.append({
      index,
      value: pair
    })
  }
}

async function findClosest (core, key) {
  if (!core.length) return null
  let latest = await core.get(core.length - 1)
  return moveCloser()

  async function moveCloser () {
    let closest = closestBlock(key, latest)  
    if (closest === -1) return latest
    latest = await core.get(closest)
    return moveCloser()
  }
}

function closestBlock (timestamp, block) {
  if (!block.index.length) return -1

  for (let i = 0; i < block.index.length; i++) {
    if (block.index[i].timestamp < timestamp) {
      if (i === 0) return -1
      return block.index[i - 1].blockIndex
    }
  }

  return block.index[block.index.length - 1].blockIndex
}

async function buildNextIndex (core) {
  const JUMP_FACTOR = 2

  const index = []
  let distance = 1
  let nextBlockIndex = core.length

  while (nextBlockIndex - distance >= 0) {
    const blockIndex = nextBlockIndex - distance
    const block = await core.get(blockIndex)

    index.push({
      timestamp: block.stats.timestamp,
      blockIndex
    })

    distance *= JUMP_FACTOR
  }

  return index
}
