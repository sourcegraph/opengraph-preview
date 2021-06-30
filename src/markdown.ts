import highlight from 'highlight.js/lib/core'
import marked from 'marked'
import escape from 'escape-html'

let registered = false

export function registerHighlightContributions(): void {
    if (registered) {
        // Don't double-register these. (There is no way to unregister them.)
        return
    }
    registered = true

    const { registerLanguage } = highlight
    registerLanguage('go', require('highlight.js/lib/languages/go'))
    registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
    registerLanguage('typescript', require('highlight.js/lib/languages/typescript'))
    registerLanguage('java', require('highlight.js/lib/languages/java'))
    registerLanguage('python', require('highlight.js/lib/languages/python'))
    registerLanguage('php', require('highlight.js/lib/languages/php'))
    registerLanguage('bash', require('highlight.js/lib/languages/bash'))
    registerLanguage('clojure', require('highlight.js/lib/languages/clojure'))
    registerLanguage('cpp', require('highlight.js/lib/languages/cpp'))
    registerLanguage('cs', require('highlight.js/lib/languages/csharp'))
    registerLanguage('csharp', require('highlight.js/lib/languages/csharp'))
    registerLanguage('css', require('highlight.js/lib/languages/css'))
    registerLanguage('dockerfile', require('highlight.js/lib/languages/dockerfile'))
    registerLanguage('elixir', require('highlight.js/lib/languages/elixir'))
    registerLanguage('haskell', require('highlight.js/lib/languages/haskell'))
    registerLanguage('html', require('highlight.js/lib/languages/xml'))
    registerLanguage('lua', require('highlight.js/lib/languages/lua'))
    registerLanguage('ocaml', require('highlight.js/lib/languages/ocaml'))
    registerLanguage('r', require('highlight.js/lib/languages/r'))
    registerLanguage('ruby', require('highlight.js/lib/languages/ruby'))
    registerLanguage('rust', require('highlight.js/lib/languages/rust'))
    registerLanguage('swift', require('highlight.js/lib/languages/swift'))
    registerLanguage('markdown', require('highlight.js/lib/languages/markdown'))
    registerLanguage('diff', require('highlight.js/lib/languages/diff'))
    registerLanguage('json', require('highlight.js/lib/languages/json'))
    registerLanguage('jsonc', require('highlight.js/lib/languages/json'))
    registerLanguage('yaml', require('highlight.js/lib/languages/yaml'))
    registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'))
    registerLanguage('dart', require('highlight.js/lib/languages/dart'))
    registerLanguage('perl', require('highlight.js/lib/languages/perl'))
    registerLanguage('scala', require('highlight.js/lib/languages/scala'))
}

export const highlightCodeSafe = (code: string, language?: string): string => {
    try {
        if (language === 'plaintext' || language === 'text') {
            return escape(code)
        }
        if (language) {
            return highlight.highlight(code, { language, ignoreIllegals: true }).value
        }
        return highlight.highlightAuto(code).value
    } catch (error) {
        console.warn('Error syntax-highlighting hover markdown code block', error)
        return escape(code)
    }
}

export const renderMarkdown = (markdown: string): string => {
    return marked(markdown, {
        gfm: true,
        sanitize: false,
        highlight: (code, language) => highlightCodeSafe(code, language),
    })
}
