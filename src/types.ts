export type JiraLogin = {
    baseUrl: string;
    email: string;
    token: string;
};

export type ActionInputs = {
    retries: number;
    retryDelay: number;
    timeout: number;
    failOnError: boolean;
    issue: string[];
    transition: string;
    assignee: string;
    comment: string;
    components: string[];
    customfields: string[];
    description: string;
    duedate: string;
    fixversions: string[];
    labels: string[];
    priority: string;
    resolution: string;
    summary: string;
    issueDelimiter: string;
};

export type Entry = {
    key: string;
    value: string;
};

export type GroupedEntries = {
    set: Entry[];
    add: Entry[];
    remove: Entry[];
};
