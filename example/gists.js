import { getGist, createGist } from '../dist/index.js'
import { gist_pat as auth } from './credentials.js'

//
;(async function main() {
  const user = 'foo'
  const name = 'bar'
  const files = {
    'README.md': {
      content: 'Hello World',
    },
    'meta.json': {
      content: JSON.stringify({ a: 1 }),
    },
  }

  const id = await createGist(files, auth, `${user}/${name}`)
  console.log('created', id)

  const gist = await getGist(id)
  console.dir(gist)
})()
