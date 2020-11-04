// Run this with the hyperspace-simulator
// hyperspace-simulator index.js

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const lexint = require('lexicographic-integer')
const { kvPairs: dictionaryPairs } = require('websters-english-dictionary')

// Toggle this on-and-off to see different behaviors.
const USE_CORRECT_ENCODING = true

start()

async function start () {
  const { corestore } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-dictionary' })

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })
  await db.ready()

  console.log('Creating dictionary database...')
  const batch = db.batch()
  for (const { key, value } of dictionaryPairs()) {
    await batch.put(key, value)
  }
  await batch.flush()
  console.log('Finished creating dictionary database.')

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
  const testQuery = encodedQueries

  for (const query of testQuery) {
    const resultSet = []
    for await (const record of db.createReadStream(query)) {
      resultSet.push(record)
    }
    console.log('query:', query, 'results:', resultSet)
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
