import { read as _read } from './util/read.js'
import { write as _write } from './util/write.js'

import getConfig from './init.js'

type jsonObject = { [key: string]: string | jsonObject }

// E.g. path == 'file.json'
export async function jsonread(path: string) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before reading'
  return (
    auth
      .login(username, password, true)
      .then((user) => _read(path, user.token))
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

function merge(initialContent: string, newContent: string) {
  return JSON.stringify(
    Object.assign(
      initialContent ? JSON.parse(initialContent) : {},
      JSON.parse(newContent)
    ),
    null,
    '\t'
  )
}

// E.g. path == 'newfile.json', data == 'some content'
export async function jsonwrite(path: string, data: jsonObject) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before writing'
  return auth
    .login(username, password, true)
    .then((user) => _write(path, user.token, JSON.stringify(data), merge))
  // .then(console.log)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}
