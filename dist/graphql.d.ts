import type { GraphQlQueryResponseData } from '@octokit/graphql';
import type { JsonObject } from 'type-fest';
export type { GraphQlQueryResponseData };
export default class GithubStorage {
    #private;
    constructor(repository: string, owner: string, pat: string, branch?: string);
    read(file: string): Promise<string>;
    save(fileChanges: {
        additions?: {
            path: string;
            contents: string | JsonObject;
        }[];
        deletions?: {
            path: string;
        }[];
    }, message?: {
        headline: string;
    }): Promise<GraphQlQueryResponseData | null>;
    private getOid;
    createBranch(branch: string, template?: string): Promise<string | null>;
}
