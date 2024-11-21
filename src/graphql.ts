import { graphql } from '@octokit/graphql'
import type { GraphQlQueryResponseData } from '@octokit/graphql'

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
  async read(file: string) {
    const {
      repository: {
        object: { text },
      },
    } = await this.#graphqlWithAuth<GraphQlQueryResponseData>(`{
    repository(name: "${this.#repository}", owner: "${this.#owner}") {
      object(expression: "HEAD:${file}") {
        ... on Blob {
          text
        }
      }
    }
  }`)
    return text
  }

  /* commit */
  async log(
    additions: { path: string; contents: string }[],
    message = {
      headline: '[log-bot]',
    }
  ) {
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
          fileChanges: {
            additions,
          },
          expectedHeadOid: await this.getOid(),
        },
      }
    )
  }

  /* read oid of head - this is needed for subsequent commit */
  private async getOid(): Promise<string> {
    const {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              nodes: {
                0: { oid },
              },
            },
          },
        },
      },
    } = await this.#graphqlWithAuth<GraphQlQueryResponseData>(
      `
        {
          repository(name: "${this.#repository}", owner: "${this.#owner}") {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 1) {
                    nodes {
                      oid
                    }
                  }
                }
              }
            }
          }
        }
      `
    )
    return oid
  }

  // https://github.com/orgs/community/discussions/35291
  async createBranch(branch: string): Promise<string | null> {
    try {
      // retrieve repositoryId and oid
      const {
        repository: {
          id,
          defaultBranchRef: {
            target: { oid },
          },
        },
      } = await this.#graphqlWithAuth<GraphQlQueryResponseData>(`{
        repository(name: "${this.#repository}", owner: "${this.#owner}") {
          id
          defaultBranchRef {
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
      } = await this.#graphqlWithAuth<GraphQlQueryResponseData>(`mutation {
        createRef(input: {name: "refs/heads/${branch}", repositoryId: "${id}", oid: "${oid}"}) {
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
