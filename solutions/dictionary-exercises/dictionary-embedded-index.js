const { kvPairs } = require('websters-english-dictionary')
const { Client } = require('hyperspace')

start()

async function start () {
  const { corestore } = new Client()
  const store = corestore()

  const core = store.get({ name: 'dictionary-exercise', valueEncoding: 'json' })
  await core.ready()

  const kvPairs = sortedDictionaryPairs()
  console.log(`Inserting ${kvPairs.length} pairs...`)
  await createDataset(core, kvPairs.slice(0, 10000))
  console.log('Inserted pairs. Querying...')

  const targets = [
    'aa',
    'bi',
    'buf',
    'aile'
  ]

  for (const target of targets) {
    const closest = await findClosest(core, target)
    console.log('target:', target, 'closest:', closest)
  }
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

function closestBlock (key, block) {
  if (!block.index.length) return -1

  for (let i = 0; i < block.index.length; i++) {
    if (block.index[i].key < key) {
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
      key: block.value.key,
      blockIndex
    })

    distance *= JUMP_FACTOR
  }

  return index
}

function sortedDictionaryPairs () {
  const pairs = kvPairs()
  pairs.sort((a, b) => {
    if (a.key < b.key) return -1
    if (a.key > b.key) return 1
    return 0
  })
  return pairs
}
