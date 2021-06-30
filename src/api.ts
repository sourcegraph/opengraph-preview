import fetch from 'node-fetch'
import { SOURCEGRAPH_TOKEN, SOURCEGRAPH_URL } from './config'

const USER_AGENT = 'SourcegraphOpenGraphPreviewService'

function fetchSourcegraphAPI<T>(body: string, userAgent: string | undefined): Promise<T> {
    return fetch(`${SOURCEGRAPH_URL}/.api/graphql`, {
        method: 'post',
        body: body,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${SOURCEGRAPH_TOKEN}`,
            'User-Agent': userAgent ?? USER_AGENT,
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

// 1-based indexing
export interface LineRange {
    startLine: number
    startLineCharacter?: number
    endLine: number
    endLineCharacter?: number
}

export function fetchHighlightedFileRange(
    repoName: string,
    commitID: string,
    filePath: string,
    startLine: number,
    endLine: number,
    userAgent: string | undefined
): Promise<string | undefined> {
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
                ranges: [{ startLine, endLine }],
            },
        }),
        userAgent
    ).then(response => response.data?.repository?.commit?.file?.highlight?.lineRanges[0]?.join(''))
}

const hoverMarkdownTextQuery = `
query DefinitionAndHover($repoName: String!, $commitID: String!, $filePath: String!, $line: Int!, $character: Int!) {
    repository(name: $repoName) {
        commit(rev: $commitID) {
            blob(path: $filePath) {
                lsif {
                    hover(line: $line, character: $character) {
                        markdown {
                            text
                        }
                    }
                }
            }
        }
    }
}`

export function fetchHoverMarkdownText(
    repoName: string,
    commitID: string,
    filePath: string,
    line: number,
    character: number,
    userAgent: string | undefined
): Promise<string | undefined> {
    type Response = {
        data: {
            repository: {
                commit: {
                    blob: {
                        lsif: {
                            hover: {
                                markdown: {
                                    text: string
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return fetchSourcegraphAPI<Response>(
        JSON.stringify({
            query: hoverMarkdownTextQuery,
            variables: {
                repoName,
                commitID,
                filePath,
                line: line,
                character: character,
            },
        }),
        userAgent
    ).then(response => response.data?.repository?.commit?.blob?.lsif?.hover?.markdown?.text)
}
