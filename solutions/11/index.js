// Run this file with the hyperspace-simulator
// hyperspace-simulator index.js

const { Client } = require('hyperspace')
const Hyperbee = require('hyperbee')
const { kvPairs: dictionaryPairs } = require('websters-english-dictionary')

start()

async function start () {
  const { corestore, replicate } = new Client()
  const store = corestore()

  const core = store.get({ name: 'hyperbee-dictionary-exercise' })
  
  // Create a new Hyperbee database with String keys/values.
  const db = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'utf-8' })

  const batch = db.batch()
  for (const { key, value } of dictionaryPairs()) {
    // Add each word definition to the batch.
    await batch.put(key, value)
  }
  // Flushing the batch appends all entries to the Hyperbee efficiently.
  await batch.flush()

  console.log('All words between \'hello\' and \'helmet\', inclusive:')
  for await (const { key, value } of db.createReadStream({ gte: 'hello', lte: 'helmet' })) {
    console.log(`  ${key}:- ${value}`)
  }
}
