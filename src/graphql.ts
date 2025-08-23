import { Buffer } from 'node:buffer'
import { graphql, GraphqlResponseError } from '@octokit/graphql'
import type { JsonObject } from 'type-fest'

// https://stackoverflow.com/questions/72836597/how-to-create-new-commit-with-the-github-graphql-api

interface RepositoryType {
  repository: {
    id: string
    object: { text: string }
    ref?: {
      target: {
        oid: string
      }
    }
  }
}

interface CreateCommitOnBranch {
  createCommitOnBranch: { commit: { oid: string } }
}

interface createRef {
  createRef: {
    ref: { name: string }
  }
}

export default class GithubStorage {
  #graphqlWithAuth
  #repository // e.g. 'sandbox-git-gateway'
  #owner // e.g. 'swiing'
  #branch
  constructor(repository: string, owner: string, pat: string, branch = 'main') {
    this.#repository = repository
    this.#owner = owner
    this.#branch = branch
    this.#graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${pat}`,
      },
    })
  }

  // e.g. file === log.json
  async read(file: string): Promise<string> {
    const {
      repository: {
        object: { text },
      },
    } = // https://docs.github.com/en/graphql/reference/queries#repository
      await this.#graphqlWithAuth<RepositoryType>(`{
    repository(name: "${this.#repository}", owner: "${this.#owner}") {
      object(expression: "${this.#branch}:${file}") {
        ... on Blob {
          text
        }
      }
    }
  }`)
    return text
  }

  /* commit */
  async save(
    fileChanges: {
      additions?: {
        path: string
        contents: string | JsonObject | JsonObject[]
      }[]
      deletions?: { path: string }[]
    },
    message = {
      headline: '[log-bot]',
    }
  ) {
    const oid = await this.getOid().catch()

    if (!oid) return null

    // Make sure content is base64 encoded, as required by
    // https://docs.github.com/en/graphql/reference/input-objects?versionId=free-pro-team%40latest&page=mutations#encoding
    fileChanges.additions?.forEach(({ path, contents }, index, additions) => {
      if (typeof contents !== 'string')
        contents = JSON.stringify(contents, null, '\t')

      additions[index] = {
        path,
        // At some point, I may be able to use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
        // but this is currently not supported by node
        // (Buffers are Uint8Array's, as per https://nodejs.org/api/buffer.html#buffers-and-typedarrays)
        contents: Buffer.from(contents, 'utf-8').toString('base64'),
      }
    })

    // https://docs.github.com/en/graphql/reference/mutations#createcommitonbranch
    const {
      createCommitOnBranch: {
        commit: {
          // @todo: I may prefer abbreviatedOid, or status, or id, or url, or committedDate,
          // or even a combination of those.
          oid: returnOid,
        },
      },
    } = await this.#graphqlWithAuth<CreateCommitOnBranch>(
      `mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
          abbreviatedOid,
          url
        }
      }
    }`,
      {
        input: {
          branch: {
            repositoryNameWithOwner: `${this.#owner}/${this.#repository}`,
            branchName: `${this.#branch}`,
          },
          message,
          fileChanges,
          expectedHeadOid: oid,
        },
      }
    )

    return returnOid
  }

  /* read oid of head - this is needed e.g. for subsequent commit */
  private async getOid(): Promise<string> {
    // https://docs.github.com/en/graphql/reference/queries#repository
    const response = await this.#graphqlWithAuth<RepositoryType>(
      `
        {
          repository(name: "${this.#repository}", owner: "${this.#owner}") {
            ref(qualifiedName: "${this.#branch}") {
              target {
                ... on GitObject {
                  oid
                }
              }
            }
          }
        }`
    ).catch(() => null)

    if (
      response == null ||
      // case where branch does not exist
      !response.repository.ref
    )
      return ''

    const {
      repository: {
        ref: {
          target: { oid },
        },
      },
    } = response

    return oid
  }

  // https://github.com/orgs/community/discussions/35291
  async createBranch(
    branch: string,
    // new branch will be created based on the template branch (defaults to 'main')
    template = 'main'
  ): Promise<string | null> {
    try {
      // retrieve repositoryId and oid
      // https://docs.github.com/en/graphql/reference/queries#repository
      const response = // https://github.com/orgs/community/discussions/35291
        await this.#graphqlWithAuth<RepositoryType>(`{
        repository(name: "${this.#repository}", owner: "${this.#owner}") {
          id
          ref(qualifiedName: "${template}") {
            target {
              ... on GitObject {
                oid
              }
            }
          }
        }
      }`)

      if (!response.repository.ref)
        throw new RangeError(`Template branch "${template}" does not exist.`)

      const {
        repository: {
          id,
          // "main" branch will be the base of the new branch
          // @todo: should I define a "template" branch and make it the base for new branches?
          ref: {
            target: { oid },
          },
        },
      } = response

      // create branch
      const {
        createRef: {
          ref: { name },
        },
      } = // https://github.com/orgs/community/discussions/35291
        // https://docs.github.com/en/graphql/reference/input-objects#createrefinput
        await this.#graphqlWithAuth<createRef>(`mutation {
        createRef(input: {name: "refs/heads/${branch}", repositoryId: "${id}", oid: "${oid}"}) {
          ref {
            name
          }
        }
      }`)
      return name
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        const msg = error.message // error.errors.map(err=>err.message)
        // Full actual message is
        // 'A ref named "refs/heads/<branch_name>" already exists in the repository.'
        if (/already exists in the repository/.test(msg))
          throw new RangeError(
            `A branch already exists with the name '${branch}'`
          )
      }
      throw error
    }
  }
}
