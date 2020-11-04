// Run this with the hyperspace-simulator
// hyperspace-simulator index.js

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const lexint = require('lexicographic-integer')

const IMDB_KEY = '1444f69f7a541e532f762c8f8847e14cc05c8b6b25886e333bc8e86e882f1033'

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ key: IMDB_KEY })

  await replicate(core)
  console.log('core:', core)

  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
  await db.ready()

  // Get a test key from the 'ids' index.
  await getSingleId(db)
  console.log()

  // Get the ten highest-rated shows.
  await tenHighestRated(db)
  console.log()

  // Get the ten lowest-rated shows.
  await tenLowestRated(db)
  console.log()

  // Search for 'thrones' using the `search` function.
  console.log('Searching for 10 titles with the keyword: \'thrones\':')
  for await (const { key, value } of search(db, 'thrones', { limit: 10 })) {
    console.log('value:', value)
  }
}

async function getSingleId (db) {
  // const { value } = await db.get('ids!tt8760684')
  const { value } = await db.get('ids!tt0886543')
  console.log('Record for ID tt8760684:', value)
}

async function tenHighestRated (db) {
  console.log('Getting the ten highest-rated shows:')
  const minRating = 'ratings!' + lexint.pack(0, 'hex')
  const maxRating = 'ratings!~' // ~ sorts higher than any other relevant value.
  const query = { gte: minRating, lte: maxRating, limit: 10, reverse: true }
  for await (const { key, value } of db.createReadStream(query)) {
    console.log(key, value)
  }
}

async function tenLowestRated (db) {
  console.log('Getting the ten lowest-rated shows:')
  const minRating = 'ratings!' + lexint.pack(0, 'hex')
  const maxRating = 'ratings!~'
  const query = { gte: minRating, lte: maxRating, limit: 10 }
  for await (const { key, value } of db.createReadStream(query)) {
    console.log(key, value)
  }
}

function search (db, keyword, opts = {}) {
  keyword = keyword.toLowerCase()
  return db.createReadStream({
    ...opts,
    gte: `keywords!${keyword}!`,
    lt: `keywords!${keyword}!~`,
    reverse: true
  })
}
