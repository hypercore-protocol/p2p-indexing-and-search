const { Client } = require('hyperspace')

const STATS_CORE_KEY = '309ba1736cc5af2940fc9fb03d256547b78ca9972ce4398648a7d7782d31ad4b'
// const TARGET = new Date('2020-11-03T23:46:57.645Z')
const TARGET = new Date(Date.now() - (60 * 20 * 1e4))

const PREFETCH = false
const NAIVE_MODE = false

start()

async function start () {
  const { corestore, network, replicate } = new Client()
  const store = corestore()

  // Get the stats core.
  const statsCore = store.get({ key: STATS_CORE_KEY, valueEncoding: 'json' })

  // Connect the stats core to the network.
  await replicate(statsCore)

  let blocksDownloaded = 0
  statsCore.on('download', () => {
    blocksDownloaded++
  })
  setInterval(() => {
    console.log('Blocks Downloaded:', blocksDownloaded)
  }, 2000)

  const algorithm = NAIVE_MODE ? getClosestStatsNaive : getClosestStatsBisectEasy

  if (PREFETCH) statsCore.download()
  const closestStats = await algorithm(statsCore, TARGET)
  if (!closestStats) {
    console.log('No stats found for that time.')
  } else {
    console.log('Found stats:', closestStats)
  }
}

async function getClosestStatsNaive (core, target) {
  for (let i = 0; i < core.length - 1; i++) {
    const block = await core.get(i)
    if (new Date(block.timestamp) >= target) return block
  }
  return null
}

async function getClosestStatsBisect(core, target) {
  return bisect(core, target, {
    get: idx => core.get(idx),
    map: block => block.timestamp
  })
}

async function getClosestStatsBisectEasy (core, target) {
  let lower = 0
  let upper = core.length

  while (lower < upper) {
    const mid = Math.floor((upper + lower) / 2)  

    // These tertiary operaters lets us easily test with Arrays first.
    const block = await core.get(mid)
    const date = new Date(block.timestamp)

    if (date < target) lower = mid + 1
    else upper = mid
  }

  return core.get(lower)
}

async function bisect (core, target, opts = {}) {
  let lower = 0
  let upper = core.length

  while (lower < upper) {
    const mid = Math.floor((upper + lower) / 2)  

    // These tertiary operaters lets us easily test with Arrays first.
    const block = opts.get ? await opts.get(mid) : core[mid]
    const toCompare = opts.map ? await opts.map(block) : block

    if (toCompare < target) lower = mid + 1
    else upper = mid
  }

  return opts.get ? opts.get(lower) : core[lower]
}

async function testBisectOnArrays () {
  const MAX_LENGTH = 20
  const TESTS_PER_LENGTH = 100
  for (let i = 0; i < MAX_LENGTH; i++) {
    for (let j = 0; j < TESTS_PER_LENGTH; j++) {
      let arr = (new Array(i)).fill(0).map((_,i) => i)
      const target = Math.random() * i
      console.log('ARR:', arr, 'TARGET:', target)
      const entry = await bisect(arr, target)
      console.log('** ENTRY:', entry)
    }
  }
}
