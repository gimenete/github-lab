const config = require('../config')

async function run() {
  const profile = await config() // Name of the profile in your ini file
  const get = profile.bent('GET') // Returns a bent function. See https://github.com/mikeal/bent

  const commits = await get(`/repos/${profile.resource}/${profile.repo}/commits`)
  // profile.repo is a custom property in our ini file
  console.log(commits)
}

run().catch(err => console.error(err.message))
