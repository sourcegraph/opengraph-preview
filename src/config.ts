import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

export const APP_ROOT = path.dirname(__dirname)
export const PORT = parseInt(process.env.SERVER_PORT || '3000')
export const SOURCEGRAPH_URL = process.env.SOURCEGRAPH_URL
export const SOURCEGRAPH_TOKEN = process.env.SOURCEGRAPH_TOKEN
export const MAX_HIGHLIGHT_RANGE = parseInt(process.env.MAX_HIGHLIGHT_RANGE || '30')
