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
  async read(file: string) {
    // https://docs.github.com/en/graphql/reference/queries#repository
    const response = await this.#graphqlWithAuth<RepositoryType>(`{
      repository(name: "${this.#repository}", owner: "${this.#owner}") {
        object(expression: "${this.#branch}:${file}") {
          ... on Blob {
            text
          }
        }
      }
    }`)
    const {
      repository: {
        object: { text },
      },
    } = response
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
    const expectedHeadOid = await this.getOid().catch()

    if (!expectedHeadOid) throw new Error('Could not determine HeadOid')

    // Make sure content is base64 encoded, as required by
    // https://docs.github.com/en/graphql/reference/input-objects?versionId=free-pro-team%40latest&page=mutations#encoding
    fileChanges.additions?.forEach(({ path, contents }, index, additions) => {
      if (typeof contents !== 'string')
        contents = JSON.stringify(contents, null, '\t')

      additions[index] = {
        path,
        // toBase64() is now supported in node 25, as well as in browsers
        // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64).
        // It has been added to typescript (https://github.com/microsoft/TypeScript/pull/61696)
        // however is not yet available in published typescript (including typescript@next)
        // @ts-ignore
        contents: new TextEncoder().encode(contents).toBase64(),
      }
    })

    // https://docs.github.com/en/graphql/reference/mutations#createcommitonbranch
    const response = await this.#graphqlWithAuth<CreateCommitOnBranch>(
      `mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
          oid
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
          expectedHeadOid,
        },
      }
    )
    // I may prefer abbreviatedOid, or status, or id, or committedDate, or url
    // or even a combination of those.
    const {
      createCommitOnBranch: {
        commit: { oid },
      },
    } = response

    return oid
  }

  /* read oid of head - this is needed e.g. for subsequent commit */
  private async getOid() {
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
  ) {
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
      // https://github.com/orgs/community/discussions/35291
      // https://docs.github.com/en/graphql/reference/input-objects#createrefinput
      const response2 = await this.#graphqlWithAuth<createRef>(`mutation {
        createRef(input: {name: "refs/heads/${branch}", repositoryId: "${id}", oid: "${oid}"}) {
          ref {
            name
          }
        }
      }`)
      const {
        createRef: {
          ref: { name },
        },
      } = response2
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
