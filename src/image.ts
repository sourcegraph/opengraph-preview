import puppeteer, { Page } from 'puppeteer'

const TWITTER_IMAGE_CARD_ASPECT_RATIO = 1.91
const DEFAULT_VIEWPORT = { width: 2000, height: 2000 }

interface Dimensions {
    x: number
    y: number
    width: number
    height: number
}

function getElementDimensions(page: Page, elementSelector: string): Promise<Dimensions> {
    return page.evaluate(elementSelector => {
        const rect = document.querySelector(elementSelector).getBoundingClientRect()
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }, elementSelector)
}

async function getScreenshotDimensions(page: Page, elementSelector: string, isTwitter: boolean): Promise<Dimensions> {
    const elementDimensions = await getElementDimensions(page, elementSelector)
    var containerOriginalAspectRatio = elementDimensions.width / elementDimensions.height
    if (isTwitter) {
        if (containerOriginalAspectRatio < TWITTER_IMAGE_CARD_ASPECT_RATIO) {
            const newHeight = elementDimensions.width / TWITTER_IMAGE_CARD_ASPECT_RATIO
            return {
                x: elementDimensions.x,
                y: elementDimensions.y,
                width: elementDimensions.width,
                height: newHeight,
            }
        } else {
            // Changes element dimensions
            await page.evaluate(aspectRatio => {
                // @ts-ignore
                fitContainerToAspectRatio(aspectRatio)
            }, TWITTER_IMAGE_CARD_ASPECT_RATIO)

            const elementNewDimensions = await getElementDimensions(page, elementSelector)
            return {
                x: elementNewDimensions.x,
                y: elementNewDimensions.y,
                width: elementNewDimensions.width,
                height: elementNewDimensions.height,
            }
        }
    }

    return {
        x: elementDimensions.x,
        y: elementDimensions.y,
        width: elementDimensions.width,
        height: elementDimensions.height,
    }
}

export async function screenshot(html: string, elementSelector: string, isTwitter = false): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--font-render-hinting=none', '--no-sandbox'],
    })

    const page = await browser.newPage()

    const viewport = page.viewport() ?? DEFAULT_VIEWPORT
    await page.setViewport({ ...viewport, ...DEFAULT_VIEWPORT })
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const screenshotDimensions = await getScreenshotDimensions(page, elementSelector, isTwitter)
    const imageBuffer = await page.screenshot({
        clip: screenshotDimensions,
        encoding: 'binary',
    })

    await browser.close()

    return imageBuffer as Buffer
}
