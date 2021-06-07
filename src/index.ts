import express from 'express'
import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { ENABLE_DEV_SERVER, DEV_SERVER_PORT } from './config'
import { handleDebugHtmlPreviewRequest, handlePreviewRequest } from './handlers'

if (ENABLE_DEV_SERVER && process.env.NODE_ENV === 'development') {
    const app = express()
    app.get('/debug/html/*', handleDebugHtmlPreviewRequest)
    app.get('*', handlePreviewRequest)
    app.listen(DEV_SERVER_PORT, () => {
        console.log(`dev server running on :${DEV_SERVER_PORT}`)
    })
}

export const cloudFunctionHandlePreviewRequest: HttpFunction = handlePreviewRequest
