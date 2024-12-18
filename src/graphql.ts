import { graphql } from '@octokit/graphql'
import type { GraphQlQueryResponseData } from '@octokit/graphql'

export type { GraphQlQueryResponseData }

// https://stackoverflow.com/questions/72836597/how-to-create-new-commit-with-the-github-graphql-api

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
    } = await this.#graphqlWithAuth<GraphQlQueryResponseData>(`{
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
      additions?: { path: string; contents: string }[]
      deletions?: { path: string }[]
    },
    message = {
      headline: '[log-bot]',
    }
  ): Promise<GraphQlQueryResponseData | null> {
    const oid = await this.getOid().catch()

    if (!oid) return null

    return await this.#graphqlWithAuth<GraphQlQueryResponseData>(
      `mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
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
  }

  /* read oid of head - this is needed e.g. for subsequent commit */
  private async getOid(): Promise<string> {
    const response = await this.#graphqlWithAuth<GraphQlQueryResponseData>(
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
      const {
        repository: {
          id,
          // "main" branch will be the base of the new branch
          // @todo: should I define a "template" branch and make it the base for new branches?
          ref: {
            target: { oid },
          },
        },
      } = // https://github.com/orgs/community/discussions/35291
        await this.#graphqlWithAuth<GraphQlQueryResponseData>(`{
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

      // create branch
      const {
        createRef: {
          ref: { name },
        },
      } = // https://github.com/orgs/community/discussions/35291
        await this.#graphqlWithAuth<GraphQlQueryResponseData>(`mutation {
        createRef(input: {name: "${branch}", repositoryId: "${id}", oid: "${oid}"}) {
          ref {
            name
          }
        }
      }`)
      return name
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
