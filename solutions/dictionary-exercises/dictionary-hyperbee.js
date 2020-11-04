const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const { kvPairs: dictionaryPairs } = require('websters-english-dictionary')

start()

async function start () {
  const { corestore } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-dictionary' })

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
  await db.ready()

  console.log('Creating dictionary database...')
  const b = db.batch()
  for (const pair of dictionaryPairs()) {
    await b.put(pair.key, pair.value)
  }
  await b.flush()
  console.log('Finished creating dictionary database.')

  console.log('Doing a full scan to find all entries with length 35...')
  console.time('full-scan')
  // await fullScanQuery(db, 35)
  console.timeEnd('full-scan')

  console.log('Building secondary index...')
  await generateSecondaryIndex(db)
  console.log('Built secondary index, running test queries...')

  const queries = [
    // { gt: '35/', lt: '36/' },
    { gt: '45/b', lt: '45/c' },
  ]

  for (const query of queries) {
    const resultSet = []
    for await (const record of db.createReadStream(query)) {
      resultSet.push(record)
    }
    console.log('query:', query, 'results:', resultSet, 'length:', resultSet.length)
  }
}

async function generateSecondaryIndex (db) {
  const b = db.batch()
  for await (const record of db.createReadStream()) {
    const key = `${record.value.length}/${record.key}`
    await b.put(key, record.value)
  }
  return b.flush()
}

async function fullScanQuery (db, length) {
  const matches = []
  for await (const record of db.createReadStream()) {
    if (record.value.length === length) matches.push(record)
  }
  console.log(`Found ${matches.length} definitions with length ${length}`)
}
