import fs from 'fs'
import path from 'path'
import { LineRange } from './api'
import { APP_ROOT } from './config'
import { registerHighlightContributions, renderMarkdown } from './markdown'

function readTemplatesFileAsString(file: string): string {
    return fs.readFileSync(path.join(APP_ROOT, 'templates', file)).toString('utf8')
}

// Bare-bones templating solution
function getCodeSnippetTemplate(): string {
    return readTemplatesFileAsString('window.html')
        .replace('/*{fontStyle}*/', readTemplatesFileAsString('source-code-pro-font.css'))
        .replace('/*{highlightStyle}*/', readTemplatesFileAsString('highlight.css'))
        .replace('/*{commonStyle}*/', readTemplatesFileAsString('common.css'))
        .replace('/*{extraStyle}*/', readTemplatesFileAsString('code-snippet.css'))
}

const CODE_SNIPPET_TEMPLATE = getCodeSnippetTemplate()

function getCodeIntelTemplate(): string {
    return readTemplatesFileAsString('window.html')
        .replace('/*{fontStyle}*/', readTemplatesFileAsString('source-code-pro-font.css'))
        .replace('/*{highlightStyle}*/', readTemplatesFileAsString('highlight.css'))
        .replace('/*{commonStyle}*/', readTemplatesFileAsString('common.css'))
        .replace('/*{extraStyle}*/', readTemplatesFileAsString('code-intel.css'))
}

const CODE_INTEL_TEMPLATE = getCodeIntelTemplate()

function formatLineRange(lineRange: LineRange): string {
    const formatLineAndCharacter = (line: number, character?: number) => line + (character ? `:${character}` : '')
    const formattedStartLine = formatLineAndCharacter(lineRange.startLine, lineRange.startLineCharacter)
    return lineRange.startLine === lineRange.endLine
        ? `?L${formattedStartLine}`
        : `?L${formattedStartLine}-${formatLineAndCharacter(lineRange.endLine, lineRange.endLineCharacter)}`
}

function formatTitle(filePath: string, lineRange: LineRange | undefined): string {
    const range = lineRange ? formatLineRange(lineRange) : ''
    return path.basename(filePath) + range
}

export function populateCodeSnippetTemplate(code: string, filePath: string, lineRange: LineRange | undefined): string {
    return CODE_SNIPPET_TEMPLATE.replace('{content}', `<table class="content theme-dark">${code}</table>`).replace(
        '{title}',
        formatTitle(filePath, lineRange)
    )
}

export function populateCodeIntelTemplate(
    markdownText: string,
    filePath: string,
    lineRange: LineRange | undefined
): string {
    registerHighlightContributions()
    const renderedMarkdown = renderMarkdown(markdownText)
    return CODE_INTEL_TEMPLATE.replace(
        '{content}',
        `<div class="content theme-dark">${renderedMarkdown}</div>`
    ).replace('{title}', formatTitle(filePath, lineRange))
}
