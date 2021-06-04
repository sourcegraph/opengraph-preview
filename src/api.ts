import fetch from 'node-fetch'
import { SOURCEGRAPH_TOKEN, SOURCEGRAPH_URL } from './config'

function fetchSourcegraphAPI<T>(body: string): Promise<T> {
    return fetch(`${SOURCEGRAPH_URL}/.api/graphql`, {
        method: 'post',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${SOURCEGRAPH_TOKEN}`,
        },
    }).then(response => response.json())
}

const highlightedBlobQuery = `
query HighlightedFile(
  $repoName: String!
  $commitID: String!
  $filePath: String!
  $ranges: [HighlightLineRange!]!
) {
    repository(name: $repoName) {
        commit(rev: $commitID) {
            file(path: $filePath) {
                highlight(disableTimeout: false, isLightTheme: true) {
                    lineRanges(ranges: $ranges)
                }
            }
        }
    }
}`

export type LineRange = { startLine: number; endLine: number }

export function fetchHighlightedFileRange(
    repoName: string,
    commitID: string,
    filePath: string,
    range: LineRange
): Promise<string> {
    type Response = {
        data: {
            repository: {
                commit: {
                    file: {
                        highlight: {
                            lineRanges: string[][]
                        }
                    }
                }
            }
        }
    }

    return fetchSourcegraphAPI<Response>(
        JSON.stringify({
            query: highlightedBlobQuery,
            variables: {
                repoName,
                commitID,
                filePath,
                ranges: [range],
            },
        })
    ).then(response => response.data.repository.commit.file.highlight.lineRanges[0].join(''))
}
