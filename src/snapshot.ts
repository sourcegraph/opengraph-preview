import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { APP_ROOT } from './config'

const previewURL = process.env.PREVIEW_URL

// Always use revision to get consistent results
const blobURLs = [
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/cmd/frontend/graphqlbackend/schema.graphql?',
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/client/web/src/end-to-end/end-to-end.test.ts?range=L353-357',
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/cmd/frontend/graphqlbackend/search_results.go?range=L1442-1459',
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/cmd/frontend/graphqlbackend/repositories.go?range=L166-169',
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/cmd/frontend/graphqlbackend/bigint.go?range=L10-40',
    '/github.com/sourcegraph/sourcegraph@01ed6ec/-/blob/cmd/frontend/graphqlbackend/search_contexts_test.go?range=L97',
    '/github.com/sourcegraph/sourcegraph@b0661f50bb6fd8cf18142c36d638faaa8015a126/-/blob/enterprise/internal/database/perms_store.go?range=L165:22&type=symbol',
    '/github.com/sourcegraph/sourcegraph@b0661f50bb6fd8cf18142c36d638faaa8015a126/-/blob/lib/codeintel/lsif/protocol/documentation.go?range=L124:6&type=symbol',
    '/github.com/sourcegraph/sourcegraph@7ad85bfcbbf6041225dc0ace026236899b2954a0/-/blob/internal/database/basestore/store.go?range=L39:6&type=symbol',
]

function fetchImage(url: string): Promise<Buffer> {
    return fetch(url).then(response => response.buffer())
}

async function main() {
    let blobIndex = 0
    for (const blobURL of blobURLs) {
        console.log(`Snapshotting ${blobURL}`)
        const imageBuffer = await fetchImage(`${previewURL}${blobURL}`)
        fs.writeFileSync(path.join(APP_ROOT, 'snapshots', `blob-${blobIndex}.png`), imageBuffer)

        const twitterImageBuffer = await fetchImage(`${previewURL}${blobURL}&twitter=1`)
        fs.writeFileSync(path.join(APP_ROOT, 'snapshots', `blob-${blobIndex}-twitter.png`), twitterImageBuffer)
        blobIndex += 1
    }
}

main()
