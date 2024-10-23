import { read as _read } from './util/read.js'
import { write as _write } from './util/write.js'

import getConfig from './init.js'

// E.g. path == 'file.csv'
export async function csvread(path: string) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before reading'
  return (
    auth
      .login(username, password, true)
      .then((user) => _read(path, user.token))
      // by convention we assume stored data is in json format
      // otherwise, throw an error
      .then((data) => data.content)
  )
  // .then(console.dir)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}

function merge(initialContent: string, newContent: string) {
  return `${initialContent ?? ''}\n${newContent}`
}

// E.g. path == 'newfile.csv', data == 'some content'
export async function csvwrite(path: string, data: string) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before writing'
  return auth
    .login(username, password, true)
    .then((user) => _write(path, user.token, data, merge))
  // .then(console.log)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}
