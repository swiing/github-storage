// originally insppired by https://github.com/dashpilot/netlify-identity-git-gateway

import GoTrue from 'gotrue-js'

const committer = { name: 'log-bot', email: 'no-reply@swiing.com' }
const branch = 'master'

let domain = ''
let username = ''
let password = ''

let auth: GoTrue | undefined = undefined

export function init(cfg: {
  username: string
  password: string
  domain: string
}) {
  domain = cfg.domain
  username = cfg.username
  password = cfg.password
  auth = new GoTrue({
    APIUrl: `https://${domain}/.netlify/identity`,
    audience: '',
    setCookie: false,
  })
}

async function getData(path: string, token: { access_token: string }) {
  let url = `https://${domain}/.netlify/git/github/contents/${path}`

  return fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then((data) => {
      if (data.code == 400) {
        // netlifyIdentity.refresh().then(function (token) {
        //   getData(path);
        // });
      } else {
        // base64 decode content
        data.content = atob(data.content)
        // by convention we assume stored data is in json format
        // otherwise, throw an error
        data.content = JSON.parse(data.content)
        return data
      }
    })
    .catch((error) => {
      return error
    })
}

async function saveData(
  path: string,
  data: { [x: number]: string },
  token: { access_token: string },
  message = '[log-bot]'
) {
  return getData(path, token)
    .then(async function (curfile) {
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

// E.g. path == 'README.md'
export async function read(path: string) {
  if (!auth) throw 'Logger must be initialiazed before reading'
  return auth
    .login(username, password, true)
    .then((user) => getData(path, user.token))
  // .then(console.dir)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}

// E.g. path == 'newfile.txt', data == 'some content'
export async function write(path: string, data: string) {
  if (!auth) throw 'Logger must be initialiazed before writing'
  return auth
    .login(username, password, true)
    .then((user) => saveData(path, { [Date.now()]: data }, user.token))
  // .then(console.log)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}
