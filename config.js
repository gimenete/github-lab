const fs = require('fs')
const ini = require('ini')
const bent = require('bent')
const jwt = require('jsonwebtoken')
const os = require('os')

const userAgent = 'something'

class Profile {
  constructor(profile) {
    Object.assign(this, profile)
  }
  auth() {
    return `Bearer ${this.token}`
  }
  bent(...params) {
    const accept = params.find(str => String(str).startsWith('application/vnd.github'))
    const rest = params.filter(str => str !== accept)
    const headers = {
      Authorization: this.auth(),
      'User-Agent': userAgent
    }
    if (accept) {
      headers['Accept'] = accept
    }
    return bent(this.baseUrl, 'json', headers, ...rest)
  }
}

module.exports = async () => {
  const profileName = process.env.GITHUB_PROFILE
  if (!profileName) {
    throw new Error(
      `Profile name not defined. Pass a value to config() or use the GITHUB_PROFILE env variable`
    )
  }
  const configFile = './github-profiles.ini'
  const profiles = ini.parse(fs.readFileSync(configFile, 'utf-8'))
  const profile = profiles[profileName]
  if (!profile) {
    throw new Error(`No profile found named ${profileName}. Check your config.ini file`)
  }
  let {
    token,
    installationId,
    appId,
    resource,
    resourceType,
    baseUrl,
    privateKey,
    expiresAt
  } = profile
  baseUrl = baseUrl || 'https://api.github.com'

  if (!baseUrl) {
    throw new Error(`No baseUrl defined for profile ${profileName}`)
  }

  async function regenerateToken() {
    if (!appId) {
      throw new Error(`No appId defined for profile ${profileName}`)
    }
    if (!privateKey) {
      throw new Error(`No privateKey defined for profile ${profileName}`)
    }
    const privateKeyPath = privateKey.replace(/^~/, os.homedir())
    const cert = fs.readFileSync(privateKeyPath, 'utf-8')
    const signedJWT = jwt.sign(
      {
        iat: Math.floor(new Date() / 1000), // Issued at time
        exp: Math.floor(new Date() / 1000) + 60, // JWT expiration time
        iss: appId
      },
      cert,
      { algorithm: 'RS256' }
    )

    const headers = {
      Accept: 'application/vnd.github.machine-man-preview+json',
      Authorization: `Bearer ${signedJWT}`,
      'User-Agent': userAgent
    }
    const get = bent(baseUrl, 'GET', 'json', headers)
    const post = bent(baseUrl, 'POST', 'json', headers, 201)

    if (!installationId) {
      const endpoints = {
        user: () => `/users/${resource}/installation`,
        organization: () => `/orgs/${resource}/installation`,
        repository: () => `/repositories/${resource}/installation`
      }
      const installation = await get(endpoints[resourceType]())
      installationId = installation.id
    }

    const accessToken = await post(`/installations/${installationId}/access_tokens`)

    profile.token = accessToken.token
    profile.expiresAt = accessToken.expires_at
    profile.installationId = installationId

    console.log('Stored new token')
    fs.writeFileSync(configFile, ini.stringify(profiles))
    return new Profile(profile)
  }

  if (!token) {
    return await regenerateToken()
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return await regenerateToken()
  }

  const headers = {
    Accept: 'application/vnd.github.antiope-preview+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': userAgent
  }
  try {
    const get = bent(baseUrl, 'GET', 'json', headers)
    await get('/')
  } catch (err) {
    if (err.res.statusCode === 401) {
      return await regenerateToken()
    } else {
      throw err
    }
  }

  return new Profile(profile)
}
