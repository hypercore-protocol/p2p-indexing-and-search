const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const lexint = require('lexicographic-integer')
const { kvPairs: dictionaryPairs } = require('websters-english-dictionary')

const USE_CORRECT_ENCODING = false
const TEST_FULL_SCAN = false

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

  if (TEST_FULL_SCAN) {
    console.log('Timing a full scan to find all entries with length 35...')
    console.time('full-scan')
    await fullScanQuery(db, 35)
    console.timeEnd('full-scan')
  }

  console.log('Building secondary index...')
  await generateSecondaryIndex(db)
  console.log('Built secondary index, running test queries...')

  const unencodedQueries = [
    { gt: '35/', lt: '36/' },
    { gt: '45/b', lt: '45/c' },
    { gt: '22/', lt: '23/', limit: 10 }
  ]
  // This will return results with length 100, 101...
  const badUnencodedQueries = [
    { gte: '0/', lt: '21/' }
  ]

  // To avoid the above problem, we need to properly encode our query bounds.
  const encodedQueries = [
    { gte: lexint.pack(0, 'hex') + '/', lt: lexint.pack(21, 'hex') + '/' }
  ]

  // Set this to one of the three options above to test things out.
  // Note: unencoded queries will not work correctly if you're using lexint.
  const testQuery = badUnencodedQueries

  for (const query of testQuery) {
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
    const definitionLength = record.value.length
    const prefix = USE_CORRECT_ENCODING ? lexint.pack(definitionLength, 'hex') : definitionLength 
    await b.put(prefix + '/' + record.key, record.value)
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
