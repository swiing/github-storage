import type { GraphQlQueryResponseData } from '@octokit/graphql';
export type { GraphQlQueryResponseData };
export default class GithubStorage {
    #private;
    constructor(repository: string, owner: string, pat: string, branch?: string);
    read(file: string): Promise<string>;
    save(fileChanges: {
        additions?: {
            path: string;
            contents: string;
        }[];
        deletions?: {
            path: string;
        }[];
    }, message?: {
        headline: string;
    }): Promise<GraphQlQueryResponseData>;
    private getOid;
    createBranch(branch: string): Promise<string | null>;
}
