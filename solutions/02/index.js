const { Client } = require('hyperspace')

start()

async function start () {
  // Create a new Hyperspace client.
  const c = new Client()

  // Get a new Corestore (a Hypercore factory).
  const store = c.corestore()

  // Core is a Hypercore instance, which is an append-only log.
  const core = store.get({ name: 'exercise-02' })

  // Wait for the internal state to load.
  await core.ready()

  console.log(core) // Prints out details like the length of the core, byteLength, key...

  await core.append('block #' + core.length)
  console.log(core.length) // Increased by 1 after the `append`.

  // Print every block in the core.
  for (let i = 0; i < core.length; i++) {
    const block = await core.get(i)
    console.log(block)
  }
}
