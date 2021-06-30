import express from 'express'
import { fetchHighlightedFileRange, fetchHoverMarkdownText, LineRange } from './api'
import { MAX_HIGHLIGHT_RANGE } from './config'
import { screenshot } from './image'
import { populateCodeSnippetTemplate, populateCodeIntelTemplate } from './template'

const BLOB_REGEX = /\/(.*)\/-\/blob\/(.*)/
// Matches L123 and L123:45
const SINGLE_LINE_REGEX = /L(\d+)(:\d+)?/
const LINE_RANGE_REGEX = /L(\d+)(:\d+)?-(\d+)(:\d+)?/

function getRangeQueryParam(req: express.Request): string {
    return req.query.range ? (req.query.range as string) : ''
}

function toZeroBasedLineRange(lineRange: LineRange): LineRange {
    return {
        startLine: lineRange.startLine - 1,
        startLineCharacter: lineRange.startLineCharacter ? lineRange.startLineCharacter - 1 : undefined,
        endLine: lineRange.endLine - 1,
        endLineCharacter: lineRange.endLineCharacter ? lineRange.endLineCharacter - 1 : undefined,
    }
}

interface BlobMatch {
    repositoryName: string
    revision: string
    filePath: string
}

function matchBlobPath(blobPath: string): BlobMatch | null {
    const matches = blobPath.match(BLOB_REGEX)
    if (!matches) {
        return null
    }
    const repositoryRevision = matches[1]
    const filePath = matches[2]
    const [repositoryName, revision] = repositoryRevision.split('@')
    return { repositoryName, revision: revision || 'HEAD', filePath }
}

function matchRange(range: string): LineRange {
    let matches
    if ((matches = range.match(LINE_RANGE_REGEX))) {
        const startLine = parseInt(matches[1])
        const startLineCharacter = matches[2] ? parseInt(matches[2].slice(1)) : undefined
        const endLine = parseInt(matches[3])
        const endLineCharacter = matches[4] ? parseInt(matches[4].slice(1)) : undefined
        const clampedEndLine = Math.min(Math.max(endLine, startLine), startLine + MAX_HIGHLIGHT_RANGE)
        return {
            startLine,
            startLineCharacter,
            endLine: clampedEndLine,
            // endLineCharacter is only valid if the endLine value was not clamped
            endLineCharacter: endLine === clampedEndLine ? endLineCharacter : undefined,
        }
    } else if ((matches = range.match(SINGLE_LINE_REGEX))) {
        const startLine = parseInt(matches[1])
        const character = matches[2] ? parseInt(matches[2].slice(1)) : undefined
        return { startLine, startLineCharacter: character, endLine: startLine }
    }
    return { startLine: 0, endLine: MAX_HIGHLIGHT_RANGE }
}

// Twitter requires that large summary card images have an aspect ratio of 1.91:1.
// Otherwise the images get cropped and centered.
const TWITTERBOT_USER_AGENT = 'Twitterbot'

function isTwitterBot(req: express.Request): boolean {
    const isTwitterBot = req.get('user-agent')?.startsWith(TWITTERBOT_USER_AGENT)
    return isTwitterBot || (process.env.NODE_ENV === 'development' && req.query.twitter === '1')
}

async function renderHtml(
    blobMatch: BlobMatch,
    lineRange: LineRange,
    isRangeRequested: boolean,
    userAgent: string | undefined
): Promise<string | undefined> {
    const zeroBasedLineRange = toZeroBasedLineRange(lineRange)
    const { repositoryName, revision, filePath } = blobMatch

    if (typeof zeroBasedLineRange.startLineCharacter !== 'undefined') {
        const hoverText = await fetchHoverMarkdownText(
            repositoryName,
            revision,
            filePath,
            zeroBasedLineRange.startLine,
            zeroBasedLineRange.startLineCharacter,
            userAgent
        )
        // Populate the code intel template if we got a valid hover text response.
        // Otherwise, fallthrough and render the associated code snippet.
        if (hoverText) {
            return populateCodeIntelTemplate(hoverText, filePath, lineRange)
        }
    }

    const highlightedRange = await fetchHighlightedFileRange(
        repositoryName,
        revision,
        filePath,
        zeroBasedLineRange.startLine,
        zeroBasedLineRange.endLine + 1,
        userAgent
    )
    if (!highlightedRange) {
        return undefined
    }
    return populateCodeSnippetTemplate(highlightedRange, filePath, isRangeRequested ? lineRange : undefined)
}

export async function handlePreviewRequest(req: express.Request, res: express.Response) {
    const rangeParam = getRangeQueryParam(req)
    const blobMatch = matchBlobPath(req.path)
    if (!blobMatch) {
        res.status(404).send('Invalid route.')
        return
    }

    const lineRange = matchRange(rangeParam)
    const requestUserAgent = req.get('user-agent')
    const renderedHtml = await renderHtml(blobMatch, lineRange, !!rangeParam, requestUserAgent)
    if (!renderedHtml) {
        res.status(400).send('Bad request.')
        return
    }
    const imageBuffer = await screenshot(renderedHtml, '.container', isTwitterBot(req))

    console.log(
        JSON.stringify({
            severity: 'INFO',
            repository: blobMatch.repositoryName,
            httpRequest: { userAgent: requestUserAgent ?? '' },
        })
    )

    res.set('Content-Type', 'image/png')
    res.end(imageBuffer, 'binary')
}

export async function handleDebugHtmlPreviewRequest(req: express.Request, res: express.Response) {
    const reqPath = req.path.slice('/debug/html'.length)
    const rangeParam = getRangeQueryParam(req)
    const blobMatch = matchBlobPath(reqPath)
    if (!blobMatch) {
        res.status(404).send('Invalid route.')
        return
    }

    const lineRange = matchRange(rangeParam)
    const requestUserAgent = req.get('user-agent')
    const renderedHtml = await renderHtml(blobMatch, lineRange, !!rangeParam, requestUserAgent)
    if (!renderedHtml) {
        res.status(400).send('Bad request.')
        return
    }
    res.send(renderedHtml)
}
