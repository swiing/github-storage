import { Octokit } from 'octokit'

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
  description: string,
  isPublic = false
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
    public: isPublic,
    files,
    headers,
  })

  // console.dir(res)
  const { status, data } = res
  // https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#create-a-gist--status-codes
  if (status !== 201 && status !== 304) return null

  //   console.dir(data)
  // const { id } = data // this is the gist hash
  // but I also want to get the revision hash
  const url = data.history![0].url
  return url ?? null
}

// ref https://octokit.github.io/rest.js/v20/#gists-update
// Note: at this stage, it seems there is no graphql API to create gists
export async function updateGist(
  gist_id: string,
  // for now, I do not support delete or rename file
  files: {
    [key: string]: {
      content?: string
      filename?: null
    }
  },
  auth: string
) {
  // Octokit.js
  // https://github.com/octokit/core.js#readme
  const octokit = new Octokit({
    // must have gists read/write permission
    // + access to all repositories (in fact private repositories), to be able to write secret gists
    auth,
  })

  const res = await octokit.rest.gists.update({
    gist_id,
    files,
  })

  // console.dir(res)
  const { /* status, */ data } = res

  // status is always === 200 in case of gist update
  // if (status !== 201 && status !== 304) return null

  // console.dir(data)
  // const { id } = data // this is the gist hash
  // but I also want to get the revision hash
  const url = data.history![0].url
  return url ?? null
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
