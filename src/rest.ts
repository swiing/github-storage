// This is kept for the record,
// but prefer the graphql api

// originally insppired by https://github.com/dashpilot/netlify-identity-git-gateway

import GoTrue from 'gotrue-js'

export type jsonObject = { [key: string]: string | jsonObject }

const committer = { name: 'log-bot', email: 'no-reply@swiing.com' }

function mergejson(initialContent: string, newContent: string) {
  return JSON.stringify(
    Object.assign(
      initialContent ? JSON.parse(initialContent) : {},
      JSON.parse(newContent)
    ),
    null,
    '\t'
  )
}

function mergecsv(initialContent: string, newContent: string) {
  return `${initialContent ?? ''}\n${newContent}`
}

export default class GithubStorage {
  auth: GoTrue
  constructor(
    public domain: string,
    public username: string,
    public password: string,
    public branch: string = 'main'
  ) {
    this.auth = new GoTrue({
      APIUrl: `https://${domain}/.netlify/identity`,
      audience: '',
      setCookie: false,
    })
  }

  // E.g. path == 'file.json'
  public async jsonread(path: string) {
    return (
      this.auth
        .login(this.username, this.password, true)
        .then((user) => this.read(path, user.token))
        // by convention we assume stored data is in json format
        // otherwise, throw an error
        .then((data) => JSON.parse(data.content))
        .catch((err) => {
          return null
        })
    )
    // .then(console.dir)
    //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
  }

  // @param path e.g. 'newfile.json',
  // @param data e.g. { key: 'some content'}
  // @param append: merges provided data to existing data
  //                otherwise file is created
  // append is meant to (and MUST) be used when the file already exists.
  // If append is not set but the file does exist already, the operation
  // will fail with result 409 Conflict.
  public async jsonwrite(path: string, data: jsonObject, append?: boolean) {
    return this.auth
      .login(this.username, this.password, true)
      .then((user) =>
        this.write(
          path,
          user.token,
          JSON.stringify(data),
          append ? mergejson : null
        )
      )
    // .then(console.log)
    //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
  }

  // E.g. path == 'file.csv'
  public async csvread(path: string) {
    return (
      this.auth
        .login(this.username, this.password, true)
        .then((user) => this.read(path, user.token))
        // by convention we assume stored data is in json format
        // otherwise, throw an error
        .then((data) => data.content)
    )
    // .then(console.dir)
    //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
  }

  // @param path e.g. 'newfile.csv',
  // @param data e.g. 'some content'
  // @param append: merges provided data to existing data
  //                otherwise file is created
  // append is meant to (and MUST) be used when the file already exists.
  // If append is not set but the file does exist already, the operation
  // will fail with result 409 Conflict.
  public async csvwrite(path: string, data: string, append?: boolean) {
    return this.auth
      .login(this.username, this.password, true)
      .then((user) =>
        this.write(path, user.token, data, append ? mergecsv : null)
      )
    // .then(console.log)
    //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
  }

  private async read(path: string, { access_token }: { access_token: string }) {
    const url = `https://${this.domain}/.netlify/git/github/contents/${path}`

    // Github API to retrieve content
    // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    return fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        accept: 'application/vnd.github+json',
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.content)
          // base64 decode content
          data.content = atob(data.content)

        return data
      })
  }

  private async write(
    path: string,
    token: { access_token: string },
    data: string, // { [x: number]: string },
    merge: Function | null,
    message = '[log-bot]'
  ) {
    const domain = this.domain
    const branch = this.branch
    return (
      merge ? this.read(path, token) : Promise.resolve({ content: '', sha: '' })
    )
      .then(async function ({ content, sha }) {
        const opts = {
          path,
          // append new content to existing content, and base64-encode
          content: btoa(merge?.(content, data) ?? data),
          branch,
          message,
          committer,
          sha,
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
}
