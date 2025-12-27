import type { JsonObject } from 'type-fest';
export default class GithubStorage {
    #private;
    constructor(repository: string, owner: string, pat: string, branch?: string);
    read(file: string): Promise<string>;
    save(fileChanges: {
        additions?: {
            path: string;
            contents: string | JsonObject | JsonObject[];
        }[];
        deletions?: {
            path: string;
        }[];
    }, message?: {
        headline: string;
    }): Promise<string>;
    private getOid;
    createBranch(branch: string, template?: string): Promise<string>;
}
