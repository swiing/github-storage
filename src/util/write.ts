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
        sha: curfile?.sha,
      }

      return fetch(`https://${domain}/.netlify/git/github/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(opts),
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
      })
    })
    .then((resp) => {
      return resp.json()
    })
    .then((data) => {
      if (data.code == 400) {
        // netlifyIdentity.refresh().then(function(token) {
        //     saveData(path)
        // })
      } else {
        return data
      }
    })
    .catch(console.error)
}
