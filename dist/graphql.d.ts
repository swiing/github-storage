import type { GraphQlQueryResponseData } from '@octokit/graphql';
export default class GithubStorage {
    #private;
    constructor(repository: string, owner: string, pat: string, branch?: string);
    read(file: string): Promise<any>;
    log(additions: {
        path: string;
        contents: string;
    }[], message?: {
        headline: string;
    }): Promise<GraphQlQueryResponseData>;
    private getOid;
    createBranch(branch: string): Promise<string | null>;
}
