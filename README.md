# github-lab

This is a repo I use to test GitHub APIs and other stuff. Instead of using cURL, Postman or Paw, I have created some scripts to do more advanced things and specially handle authentication with GitHub apps. Support for personal access tokens will be added soon.

## Usage

You can clone/fork this repo and use it as a starting point for testing your own things. Copy `github-profiles.example.ini` to `github-profiles.ini`. Then edit it using your own information. Each section is a `profile` (this is inspired by [AWS profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)). Here's a description of all the fields you can use:

```ini
[profile-name]
; This is the default value, you can ignore it
baseUrl=https://api.github.com
; Private key of your GitHub app
privateKey=~/Downloads/some-app-name.2019-01-03.private-key.pem
; Where the app is installed
resource=gimenete
; Type of "resource" where the app is installed. Can be user, organization or repository
resourceType=user
; Your GitHub application id
appId=5

; You can store more information if you want. Feel free to add anything
repo=test2
```

Then in your script you can do:

```js
// scripts/example.js
const config = require('../config')

async function run() {
  const profile = await config() // Loads the config and creates an access token if needed
  // Now `profile` contains all the information contained in the ini file for that profile, plus auth information and the bent() method
  const get = profile.bent('GET') // Returns a bent function. See https://github.com/mikeal/bent

  const commits = await get(`/repos/${profile.resource}/${profile.repo}/commits`) // profile.repo is a custom property in our ini file
  console.log(commits)
}

run().catch(err => console.error(err.message))
```

Now run it with:

```bash
GITHUB_PROFILE=profile-name node scripts/example.js
```

Every time `await config('profile-name')` is invoked it loads the config file and specifically the profile you specified. It will see if there's a `token` attribute in the ini file. If not, it will create a new one and store it, along with other information such as the expiration date of the token and the installation id. You don't have to worry about it, it is transparent to you.

Instead of passing a value to `config()` you can also leave it empty and use the `GITHUB_PROFILE` env variable.
