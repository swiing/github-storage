import { read as _read } from './util/read.js'
import { write as _write } from './util/write.js'

import getConfig from './init.js'

// E.g. path == 'file.json'
export async function read(path: string) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before reading'
  return auth
    .login(username, password, true)
    .then((user) => _read(path, user.token))
    .then((data) => data?.content)
  // .then(console.dir)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}

// E.g. path == 'newfile.json', data == 'some content'
export async function write(path: string, data: string) {
  const { auth, username, password } = getConfig()

  if (!auth) throw 'Logger must be initialiazed before writing'
  return auth
    .login(username, password, true)
    .then((user) => _write(path, user.token, { [Date.now()]: data }))
  // .then(console.log)
  //   .catch((error) => console.log(`Failed :( ${JSON.stringify(error)}`))
}
