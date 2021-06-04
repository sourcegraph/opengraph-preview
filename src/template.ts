import fs from 'fs'
import path from 'path'
import { LineRange } from './api'
import { APP_ROOT } from './config'

// Bare-bones templating solution
function getCodeSnippetTemplate(): string {
    const readFileAsString = (file: string): string =>
        fs.readFileSync(path.join(APP_ROOT, 'templates', file)).toString('utf8')

    return readFileAsString('code-snippet.html')
        .replace('/*{fontStyle}*/', readFileAsString('source-code-pro-font.css'))
        .replace('/*{highlightStyle}*/', readFileAsString('highlight.css'))
        .replace('/*{codeSnippetStyle}*/', readFileAsString('code-snippet.css'))
}

const CODE_SNIPPET_TEMPLATE = getCodeSnippetTemplate()

export function populateCodeSnippetTemplate(code: string, filePath: string, lineRange: LineRange | undefined): string {
    const range = lineRange
        ? lineRange.startLine + 1 === lineRange.endLine
            ? `#L${lineRange.startLine + 1}`
            : `#L${lineRange.startLine + 1}-${lineRange.endLine}`
        : ''
    return CODE_SNIPPET_TEMPLATE.replace('{code}', code)
        .replace('{title}', path.basename(filePath))
        .replace('{range}', range)
}
