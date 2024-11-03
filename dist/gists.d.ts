export declare function createGist(files: {
    [key: string]: {
        content: string;
    };
}, auth: string, description: string): Promise<string | null | undefined>;
export declare function getGist(gist_id: string, auth?: string): Promise<{
    forks?: {
        id?: string;
        url?: string;
        user?: import("@octokit/openapi-types").components["schemas"]["public-user"];
        created_at?: string;
        updated_at?: string;
    }[] | null;
    history?: import("@octokit/openapi-types").components["schemas"]["gist-history"][] | null;
    fork_of?: {
        url: string;
        forks_url: string;
        commits_url: string;
        id: string;
        node_id: string;
        git_pull_url: string;
        git_push_url: string;
        html_url: string;
        files: {
            [key: string]: {
                filename?: string;
                type?: string;
                language?: string;
                raw_url?: string;
                size?: number;
            };
        };
        public: boolean;
        created_at: string;
        updated_at: string;
        description: string | null;
        comments: number;
        user: import("@octokit/openapi-types").components["schemas"]["nullable-simple-user"];
        comments_url: string;
        owner?: import("@octokit/openapi-types").components["schemas"]["nullable-simple-user"];
        truncated?: boolean;
        forks?: unknown[];
        history?: unknown[];
    } | null;
    url?: string;
    forks_url?: string;
    commits_url?: string;
    id?: string;
    node_id?: string;
    git_pull_url?: string;
    git_push_url?: string;
    html_url?: string;
    files?: {
        [key: string]: {
            filename?: string;
            type?: string;
            language?: string;
            raw_url?: string;
            size?: number;
            truncated?: boolean;
            content?: string;
        } | null;
    };
    public?: boolean;
    created_at?: string;
    updated_at?: string;
    description?: string | null;
    comments?: number;
    user?: string | null;
    comments_url?: string;
    owner?: import("@octokit/openapi-types").components["schemas"]["simple-user"];
    truncated?: boolean;
}>;
