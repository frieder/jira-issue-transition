import { ActionInputs, JiraLogin } from "./types";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

export function createHTTPClient(jira: JiraLogin, inputs: ActionInputs): AxiosInstance {
    const httpClient: AxiosInstance = axios.create({
        baseURL: jira.baseUrl,
        auth: {
            username: jira.email,
            password: jira.token,
        },
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        timeout: inputs.timeout,
    });

    axiosRetry(httpClient, {
        retries: inputs.retries,
        retryCondition: () => true,
        retryDelay: () => inputs.retryDelay * 1000,
        shouldResetTimeout: true,
        onRetry: (retryCount, error) => {
            console.log(
                `[${retryCount}/${inputs.retries}] Request failed with rc = ${error.response?.status}, wait for ${inputs.retryDelay} seconds and try again`
            );
        },
    });

    return httpClient;
}

export async function determineTransitionID(
    httpClient: AxiosInstance,
    issue: string,
    transition: string
) {
    if (transition.match(/^\d+$/)) {
        return Number(transition);
    }

    const response = await httpClient.get(`/rest/api/3/issue/${issue}/transitions`);

    for (const entry of response.data.transitions) {
        if (entry.name === transition) {
            return entry.id;
        }
    }

    throw new Error(`Cannot find a transition with name [${transition}] for Jira issue [${issue}]`);
}

export async function transitionIssue(httpClient: AxiosInstance, issue: string, payload: any) {
    await httpClient.post(`/rest/api/3/issue/${issue}/transitions`, payload);
}
