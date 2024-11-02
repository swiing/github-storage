import GoTrue from 'gotrue-js';
export type jsonObject = {
    [key: string]: string | jsonObject;
};
export default class GithubStorage {
    domain: string;
    username: string;
    password: string;
    branch: string;
    auth: GoTrue;
    constructor(domain: string, username: string, password: string, branch?: string);
    jsonread(path: string): Promise<any>;
    jsonwrite(path: string, data: jsonObject, append?: boolean): Promise<any>;
    csvread(path: string): Promise<any>;
    csvwrite(path: string, data: string, append?: boolean): Promise<any>;
    private read;
    private write;
}
