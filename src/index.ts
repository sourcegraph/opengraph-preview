import express from 'express'
import { fetchHighlightedFileRange, LineRange } from './api'
import { MAX_HIGHLIGHT_RANGE, PORT } from './config'
import { screenshot } from './image'
import { populateCodeSnippetTemplate } from './template'

const app = express()

const BLOB_REGEX = /\/(.*)\/-\/blob\/(.*)/
// Matches L123 and L123:45
const SINGLE_LINE_RANGE_REGEX = /L(\d+)/
const LINE_RANGE_REGEX = /L(\d+)-(\d+)/

function getRangeQueryParam(req: express.Request): string {
    return req.query.range ? (req.query.range as string) : ''
}

type BlobMatch = { repositoryName: string; revision: string; filePath: string }

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
        const startLine = parseInt(matches[1]) - 1
        const endLine = parseInt(matches[2])
        const clampedEndLine = Math.min(Math.max(endLine, startLine), startLine + MAX_HIGHLIGHT_RANGE)
        return { startLine, endLine: clampedEndLine }
    } else if ((matches = range.match(SINGLE_LINE_RANGE_REGEX))) {
        const startLine = parseInt(matches[1]) - 1
        return { startLine, endLine: startLine + 1 }
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

if (process.env.NODE_ENV === 'development') {
    app.get('/debug/html/*', async (req, res) => {
        const reqPath = req.path.slice('/debug/html'.length)
        const rangeParam = getRangeQueryParam(req)
        const blobMatch = matchBlobPath(reqPath)
        if (!blobMatch) {
            res.status(404).send('Invalid route.')
            return
        }

        const { repositoryName, revision, filePath } = blobMatch
        const lineRange = matchRange(rangeParam)

        const highlightedRange = await fetchHighlightedFileRange(repositoryName, revision, filePath, lineRange)
        if (!highlightedRange) {
            res.status(400).send('Bad request.')
            return
        }
        res.send(populateCodeSnippetTemplate(highlightedRange, filePath, rangeParam ? lineRange : undefined))
    })
}

app.get('*', async (req, res) => {
    const reqPath = req.path
    const rangeParam = getRangeQueryParam(req)

    const blobMatch = matchBlobPath(reqPath)
    if (!blobMatch) {
        res.status(404).send('Invalid route.')
        return
    }

    const { repositoryName, revision, filePath } = blobMatch
    const lineRange = matchRange(rangeParam)

    const highlightedRange = await fetchHighlightedFileRange(repositoryName, revision, filePath, lineRange)
    if (!highlightedRange) {
        res.status(400).send('Bad request.')
        return
    }
    const codeSnippet = populateCodeSnippetTemplate(highlightedRange, filePath, rangeParam ? lineRange : undefined)
    const imageBuffer = await screenshot(codeSnippet, '.container', isTwitterBot(req))

    res.set('Content-Type', 'image/png')
    res.end(imageBuffer, 'binary')
})

app.listen(PORT, () => {
    console.log(`server running on :${PORT}`)
})
