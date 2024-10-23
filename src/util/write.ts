import getConfig from '../init.js'
import { read } from './read.js'

const committer = { name: 'log-bot', email: 'no-reply@swiing.com' }
const branch = 'master'

export async function write(
  path: string,
  token: { access_token: string },
  data: { [x: number]: string },
  message = '[log-bot]'
) {
  return read(path, token)
    .then(async function (curfile) {
      const { domain } = getConfig()
      // let user = netlifyIdentity.currentUser()
      // let token = user.token.access_token
      const opts = {
        path,
        message,
        content: btoa(
          // append new content to existing content
          JSON.stringify(Object.assign(curfile?.content || {}, data))
        ),
        branch,
        committer,
        sha: curfile.sha,
      }

      // Github API to write content
      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
      return fetch(`https://${domain}/.netlify/git/github/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(opts),
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          accept: 'application/vnd.github+json',
        },
      })
    })
    .then((resp) => {
      return resp.json()
    })
    .catch(console.error)
}
