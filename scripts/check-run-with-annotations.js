const config = require('../config')

async function run() {
  const profile = await config()
  const get = profile.bent('GET')

  const commits = await get(`/repos/${profile.resource}/${profile.repo}/commits`)
  const { sha } = commits[0]

  const post = profile.bent('POST', 'application/vnd.github.antiope-preview+json', 201)

  const body = {
    name: 'test-check2',
    head_sha: sha,
    status: 'completed',
    conclusion: 'success',
    completed_at: new Date(),
    output: {
      title: 'Output title',
      summary: 'The **summary**',
      annotations: [
        {
          path: 'README.md',
          start_line: 1,
          end_line: 1,
          start_column: 0,
          end_column: 2,
          annotation_level: 'notice',
          title: 'Annotation',
          message: 'annotation in README.md',
          raw_details: 'XXX123123adfasdfdsf'
        }
      ]
    }
  }

  await post(`/repos/${profile.resource}/${profile.repo}/check-runs`, body)
}

run().catch(err => console.error(err.message))
