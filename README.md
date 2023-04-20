# Jira Issue Transition - Github Action

[![Build Status](https://img.shields.io/github/actions/workflow/status/frieder/jira-issue-transition/ci-build.yml?label=Build%20Status)](https://github.com/frieder/jira-issue-transition/actions/workflows/ci-build.yml)
[![Sonar Coverage](https://img.shields.io/sonar/coverage/frieder_jira-issue-transition/main?server=https%3A%2F%2Fsonarcloud.io&label=Code%20Coverage)](https://sonarcloud.io/project/overview?id=frieder_jira-issue-transition)
[![Open Issues](https://img.shields.io/github/issues-raw/frieder/jira-issue-transition?label=Open%20Issues)](https://github.com/frieder/jira-issue-transition/issues?q=is%3Aopen+is%3Aissue)
[![Sonar Issues](https://img.shields.io/sonar/violations/frieder_jira-issue-transition/main?format=long&server=https%3A%2F%2Fsonarcloud.io&label=Sonar%20Violations)](https://sonarcloud.io/project/overview?id=frieder_jira-issue-transition)

A GitHub action to transition an issue from one state to another. While doing so, it can set properties that may be required
to successfully pass the transition.

> -   Only supports Jira Cloud.
> -   Requires [Jira Login Action](https://github.com/marketplace/actions/jira-login).

## Usage

```yaml
name: Jira Issue Transition

on: [..]

jobs:
  jira-issue-transition:
    name: Transition Jira issue
    runs-on: ubuntu-latest
    steps:
      - name: Jira Login
        uses: atlassian/gajira-login@v3
        env:
          JIRA_BASE_URL: ${{ vars.JIRA_BASE_URL }}
          JIRA_USER_EMAIL: ${{ vars.JIRA_USER_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}

      - name: Transition Issue
        uses: frieder/jira-issue-transition@v1
        with:
          retries: 1
          retryDelay: 10
          timeout: 2000
          failOnError: true
          # Either one of the following three formats for 'issue' is valid (spaces are trimmed)
          issue: XYZ-123
          issue: XYZ-1, XYZ-2
          issue: |
            XYZ-1
            XYZ-2
          # Either one of the following two formats for 'transition' is valid 
          transition: In Progress
          transition: 21
          # following are properties that can be set if defined in the transition screen & required by validator
          assignee: 123456:12345678-abcd-abcd-abcd-1234567890ab
          comment: Plaintext only
          components: |
            = component1
            = component2
            + component3
            - component2
          customfields: |
            10050: some value
            10051: 2023-01-01
            10052: https://github.com/marketplace?type=action
          description: Plaintext only
          duedate: 2023-02-01
          fixversions: |
            = 1.0
            = 1.1
            + 2.0
            - 1.1
          labels: |
            = foo
            = foo2
            = bar2
            + bar
            - foo2
            - bar2
          priority: Lowest
          resolution: Won't Do
          summary: Some new fancy title
```

## Conditional Transition

The action is always executed regardless of whether the issue is already in the target state. It is however possible
to prevent a transition from being applied based on the current state of the ticket. To do this you can use the
[jira-issue-info](https://github.com/marketplace/actions/jira-issue-info) action to pull the information from the
ticket and then apply conditions on the transition steps. Following is an example how this can be done.

```yaml
steps:
  - name: Jira Login
    uses: atlassian/gajira-login@v3
    env:
      JIRA_BASE_URL: ${{ vars.JIRA_BASE_URL }}
      JIRA_USER_EMAIL: ${{ vars.JIRA_USER_EMAIL }}
      JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}

  - name: Get Issue Properties
    uses: frieder/jira-issue-info@v1
    with:
      issue: XYZ-123
    id: issue

  # Dummy Workflow: To Do --> Start Work (transition id = 42) --> In Progress

  - name: Transition Issue To 'In Progress'
    # is only executed when the ticket is not in 'In Progress' state already
    if: fromJSON(steps.issue.outputs.json).fields.status.name != 'In Progress'
    uses: frieder/jira-issue-transition@v1
    with:
      issue: XYZ-123
      transition: Start Work | 42
```


## Configuration Options

### Option: retries

|          |     |
| :------- | :-- |
| Required | no  |
| Default  | 1   |

This option allows to define a number of retries when the HTTP call to the Jira REST API fails (e.g. due to
connectivity issues). By default, the action will attempt one retry and after that report the action as failed.

### Option: retryDelay

|          |     |
| :------- | :-- |
| Required | no  |
| Default  | 10  |

In case the `retries` option is > 0, this option defines the time (in seconds) the action will wait in
between the requests.

### Option: timeout

|          |      |
| :------- | :--- |
| Required | no   |
| Default  | 2000 |

The time (in milliseconds) the action will wait for a request to finish. If the request does not finish in
time it will be considered failed.

### Option: failOnError

|          |      |
| :------- |:-----|
| Required | no   |
| Default  | true |

When set to true (default) the action will report back as failed whenever at least one issue could not be
transitioned. When set to false it means the action will never fail regardless of whether there are failed
issue transitions. For the latter case the action will register outputs with additional information about
which issues failed and which were transitioned successfully. Also see the output section at the end of this
readme.

> The option failOnError is only covering the actual API requests to transition the defined tickets. If it
> is set to false and an error occurs outside the requests (e.g. when reading the inputs from the workflow
> file), the action will still fail.

### Option: issue

|          |     |
| :------- | :-- |
| Required | yes |
| Default  |     |

The ID of the Jira ticket (e.g. XYZ-123).

### Option: transition

|          |     |
| :------- | :-- |
| Required | yes |
| Default  |     |

The ID or the name of the transition that should be applied to the Jira issue.

> The benefit of using the name of a transition over its ID is that different workflows are supported.
> However the action will then query the transition ID for each issue separately which results in
> additional requests that slow down the execution time and increase the chances for the action to
> fail. When the transition ID is immutable (same workflow for all issues) consider using the
> transition ID directly over the name (speed and robustness over convenience).

> To get the ID of a transition check the workflow in text mode or check the [REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-get).

### Option: summary

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the summary (title) of the ticket. <br>
The option is ignored when blank.

### Option: description

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the description of the ticket. <br>
The option is ignored when blank.

> This option only allows for a simple plaintext to be set. If some rich description with links,
> paragraphs, bullet points, images is required a custom logic must be used which is not covered
> (nor planned!) by this action.

### Option: assignee

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the assignee of the ticket. For this the ID of the respective user is required.

> To get the ID of yourself just open the profile page and check the URL for the ID.
> Another possibility is to use the [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-user-search/#api-rest-api-3-user-assignable-search-get).

The option is ignored when blank. To remove the assignee set the value to `REMOVE`.

### Option: priority

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the priority of the ticket. Possible values are the actual names of the priorities as defined in
`https://ACCOUNT.atlassian.net/secure/admin/ViewPriorities.jspa`. By default, these names are:

-   `Lowest`
-   `Low`
-   `Medium`
-   `High`
-   `Highest`

The option is ignored when blank.

### Option: duedate

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the due date of the ticket. The format must be in ISO 8601 format - `yyyy-MM-dd`. <br>
The option is ignored when blank. To remove the assignee set the value to `REMOVE`.

### Option: components

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

> Make sure your project template supports components or this option will not work. Also make sure
> the components exist in Jira (check your project's settings) before using them in this action.

Allows to `set|add|remove` components to a Jira ticket. A set of components must be provided with
one entry per line. Depending on the prefix different actions are performed.

-   `=` When a line is prefixed with this character it will be treated like a `SET` action.
-   `+` When a line is prefixed with this character it will be treated like an `ADD` action.
-   `-` When a line is prefixed with this character it will be treated like a `REMOVE` action.
-   `no prefix` - When a line does not have any prefix as described above it will be ignored.

In order for this to work all entries will first be grouped and assigned to one of the three groups.
Afterwards it will create a body payload that includes the `SET` group first followed by the `ADD`
group and then the `REMOVE` group. Check the [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put)
for more information.

> When a `SET` group is available it will basically replace whatever was available before. The `ADD`
> group will then add additional entries on top of the new values from the `SET` group. The `REMOVE`
> group will be applied last and will remove entries that were added by the two other groups. The
> usual use-case however is to either use `SET` or a combination of `ADD`and `REMOVE` groups. In most
> cases it does not make sense to mix all three groups in one step.

The option is ignored when blank.

### Option: fixversions

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

> Make sure your project template supports versions or this option will not work. Also make sure
> the versions exist in Jira (check your project's releases) before using them in this action.

Allows to `set|add|remove` fix versions for a Jira ticket. A set of versions must be provided with
one entry per line. Depending on the prefix different actions are performed.

-   `=` When a line is prefixed with this character it will be treated like a `SET` action.
-   `+` When a line is prefixed with this character it will be treated like an `ADD` action.
-   `-` When a line is prefixed with this character it will be treated like a `REMOVE` action.
-   `no prefix` - When a line does not have any prefix as described above it will be ignored.

In order for this to work all entries will first be grouped and assigned to one of the three groups.
Afterwards it will create a body payload that includes the `SET` group first followed by the `ADD`
group and then the `REMOVE` group. Check the [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put)
for more information.

> When a `SET` group is available it will basically replace whatever was available before. The `ADD`
> group will then add additional entries on top of the new values. The `REMOVE` group will then
> remove entries that were added by the two other groups. The usual use-case however is to either
> use `SET` or a combination of `ADD`and `REMOVE` groups. It does not make sense to mix all three groups
> in one step.

The option is ignored when blank.

### Option: labels

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Allows to `set|add|remove` labels to a Jira ticket. A set of labels must be provided with
one entry per line. Depending on the prefix different actions are performed.

-   `=` When a line is prefixed with this character it will be treated like a `SET` action.
-   `+` When a line is prefixed with this character it will be treated like an `ADD` action.
-   `-` When a line is prefixed with this character it will be treated like a `REMOVE` action.
-   `no prefix` - When a line does not have any prefix as described above it will be ignored.

In order for this to work all entries will first be grouped and assigned to one of the three groups.
Afterwards it will create a body payload that includes the `SET` group first followed by the `ADD`
group and then the `REMOVE` group. Check the [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put)
for more information.

> When a `SET` group is available it will basically replace whatever was available before. The `ADD`
> group will then add additional entries on top of the new values. The `REMOVE` group will then
> remove entries that were added by the two other groups. The usual use-case however is to either
> use `SET` or a combination of `ADD`and `REMOVE` groups. It does not make sense to mix all three groups
> in one step.

> When a value for a non-existing component is used the Jira REST API will create such a component.

The option is ignored when blank.

### Option: customfields

|          |     |
| :------- | :-- |
| Required | no  |
| Default  |     |

Updates the value of custom fields in the Jira ticket. It expects a set of IDs for the custom fields along
with their associated value, separated by a colon (`:`). One entry per line.

> The value of a custom field can contain colons (`:`) as only the first occurance of a colon per line is
> interpreted as a delimiter.

The option is ignored when blank.

## Outputs

This action provides some information via outputs for post-processing. Following is an overview of the keys
registered with the action's output.

1. `hasErrors` - A boolean value indicating whether there are issues that have not been updated successfully.
   This is useful when the failOnError option is set to false and one still wants to check if there
   have been failed transition attempts (e.g. for reporting back to MSTeams or Slack).
2. `successful` - A list of IDs of issues that have successfully been updated. The format is the same as used
   with the issues option (either comma or line separated).
3. `failed` - A list of IDs of issues that failed to get updated. This may be useful to add comments to the tickets
   in question or to report those tickets to a Slack or MSTeams channel. The format is again the same as
   with the issues option.
