import { Octokit, App } from 'octokit'

const headers = { 'X-GitHub-Api-Version': '2022-11-28' }

// ref https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#create-a-gist
// Note: at this stage, it seems there is no graphql API to create gists
export async function createGist(
  files: {
    [key: string]: {
      content: string
    }
  },
  auth: string,
  description: string
) {
  // Octokit.js
  // https://github.com/octokit/core.js#readme
  const octokit = new Octokit({
    // must have gists read/write permission
    // + access to all repositories (in fact private repositories), to be able to write secret gists
    auth,
  })

  const res = await octokit.request('POST /gists', {
    description,
    public: false,
    files,
    headers,
  })

  // console.dir(res)
  const { status, data } = res
  // https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#create-a-gist--status-codes
  if (status !== 201 && status !== 304) return null

  //   console.dir(data)
  const { id } = data
  return id
}

// ref https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#get-a-gist
export async function getGist(gist_id: string, auth?: string) {
  // Octokit.js
  // https://github.com/octokit/core.js#readme
  const octokit = new Octokit({
    // no token needed to read public gists
    // auth: 'YOUR-TOKEN'
    auth,
  })

  //   const gist = await octokit.request(
  //     `GET /gists/${gist_id}`,
  //     {
  //       gist_id,
  //       headers: {
  //         'X-GitHub-Api-Version': '2022-11-28',
  //       },
  //     }
  //   )

  const gist = await octokit.rest.gists.get({
    gist_id,
    headers,
  })

  return gist.data // ?.files!['meta.json']
}
