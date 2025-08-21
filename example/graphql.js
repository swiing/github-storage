import { GithubStorage } from '../dist/index.js'
import { repository, owner, pat, branch } from './credentials.js'

/* initialise */
const storage = new GithubStorage(repository, owner, pat, branch)

/* read data */
const file = 'log.json'
console.log(`reading ${file}`)
// await, otherwise there is a risk of 409 Conflict response
// when trying to write subsequently
const text = await storage
  .read(file) //
  .then((result) => {
    console.log(result)
    return result
  })
  .catch(console.error)

/* write data */
console.log('writing')
await storage
  .save({
    additions: [
      {
        path: 'myfile2.txt',
        contents: 'SGVsbG8gZnJvbSBKQVZBIGFuZCBHcmFwaFFM',
      },
      {
        path: 'log2.json',
        contents: {
          ...{ [Date.now()]: 'some content' },
          ...JSON.parse(text),
        },
      },
    ],
  })
  .then(console.dir)
  .catch(console.error) /* */

/* deletions */
console.log('deleting log2.json')
await storage
  .save({
    additions: [
      {
        path: 'myfile2.txt',
        contents: 'SGVsbG8gZnJvbSBKQVZBIGFuZCBHcmFwaFFM',
      },
    ],
    deletions: [
      {
        path: 'log2.json',
      },
    ],
  })
  .then(console.dir)
  .catch(console.error) /* */

// create branch
const aBranchName = 'testbranch3'
console.log(`creating branch ${aBranchName}`)
try {
  const newbranch = await storage.createBranch(aBranchName, branch)
  if (newbranch) console.log(`created branch ${newbranch}.`)
  else console.log(`could not create branch ${aBranchName}.`)
} catch (err) {
  console.dir(err)
}
