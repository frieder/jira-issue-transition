import { ActionInputs, JiraLogin } from "./types";
import { getBooleanInput, getInput, getMultilineInput, InputOptions } from "@actions/core";
import * as fs from "fs";
import * as YAML from "yaml";

const inputOpts: InputOptions = { required: false, trimWhitespace: true };

export function getLoginData(): JiraLogin {
    const configPath = `${process.env.HOME}/jira/config.yml`;
    return YAML.parse(fs.readFileSync(configPath, "utf8"));
}

export function getInputs(): ActionInputs {
    let issue: string[] = [];
    let delim = "";

    const rawIssue = getMultilineInput("issue", { ...inputOpts, required: true });
    if (rawIssue.length === 1) {
        issue = rawIssue[0].split(",").map((str) => str.trim());
        delim = rawIssue[0].includes(",") ? "," : "";
    } else {
        issue = rawIssue.map((str) => str.trim());
        delim = "\n";
    }

    return {
        retries: _getNumber("retries", 1),
        retryDelay: _getNumber("retryDelay", 10),
        timeout: _getNumber("timeout", 2000),
        failOnError: getBooleanInput("failOnError", inputOpts),
        issue: issue,
        transition: getInput("transition", { ...inputOpts, required: true }),
        summary: getInput("summary", inputOpts),
        description: getInput("description", inputOpts),
        assignee: getInput("assignee", inputOpts),
        priority: getInput("priority", inputOpts),
        duedate: getInput("duedate", inputOpts),
        components: getMultilineInput("components", inputOpts),
        fixversions: getMultilineInput("fixversions", inputOpts),
        labels: getMultilineInput("labels", inputOpts),
        customfields: getMultilineInput("customfields", inputOpts),
        resolution: getInput("resolution", inputOpts),
        comment: getInput("comment", inputOpts),
        issueDelimiter: delim,
    };
}

function _getNumber(name: string, defaultValue: number): number {
    const value = getInput(name, inputOpts);
    if (!value || value.length === 0) {
        return defaultValue;
    }
    return value.match(/^\d+$/) ? Number(value) : defaultValue;
}
