import * as core from "@actions/core";
import { getInputs, getLoginData } from "./config";
import { createPayload } from "./payload";
import { createHTTPClient, determineTransitionID, transitionIssue } from "./request";
import { AxiosInstance } from "axios";
import { ActionInputs } from "./types";

let hasErrors = false;
const success: string[] = [];
const failed: string[] = [];

run().catch((err: any) => {
    core.setFailed(
        "An unexpected exception has occurred. Check the error stacktrace for more info"
    );
    core.error(err);
});

async function run() {
    const login = getLoginData();
    const inputs = getInputs();
    const httpClient = createHTTPClient(login, inputs);

    const promises: Promise<void>[] = [];

    for (const issue of inputs.issue) {
        promises.push(processIssue(issue, httpClient, inputs));
    }

    await Promise.all(promises).then(() => {
        setOutput(inputs.issueDelimiter);
        setResult(inputs.failOnError);
    });
}

async function processIssue(issue: string, httpClient: AxiosInstance, inputs: ActionInputs) {
    try {
        const transactionId = await determineTransitionID(httpClient, issue, inputs.transition);
        const payload = createPayload(inputs, transactionId);
        await transitionIssue(httpClient, issue, payload);
        core.info(`Transition of Jira issue [${issue}] successful.`);
        success.push(issue);
    } catch (err: any) {
        hasErrors = true;
        failed.push(issue);
        core.error(`Transition of Jira issue [${issue}] failed.`);
        core.error(JSON.stringify(err.response?.data));
    }
}

function setOutput(issueDelimiter: string) {
    core.setOutput("hasErrors", hasErrors);
    core.setOutput("successful", success.join(issueDelimiter));
    core.setOutput("failed", failed.join(issueDelimiter));
}

function setResult(failOnError: boolean) {
    if (!hasErrors && failed.length === 0) {
        core.info("The transition of all Jira issues was successful");
        return;
    }

    if (failOnError) {
        core.setFailed("The transition of some tickets failed.");
    } else if (hasErrors) {
        core.error("The transition of some tickets failed.");
    }
}
