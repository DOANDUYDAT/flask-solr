const puppeteer = require('puppeteer')
const fs = require('fs')

async function getLinks(path) {

    let browser = null
    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:3000',
            
        })
        // const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
                req.abort()
            }
            else {
                req.continue()
            }
        })
        await page.goto('http://kenh14.vn' + path)
        await page.waitFor(3000)

        const rs = await page.evaluate(() => {
            let title = document.querySelector('.kbwc-title').textContent
            let content = document.querySelector('.klw-new-content').textContent
            let date = document.querySelector('.kbwcm-time').title
            let author = document.querySelector('.kbwcm-author').textContent
            let theo = document.querySelector('.kbwcm-source > a:nth-child(1)').textContent
            return {
                title: title,
                content: content,
                date: date,
                author: author,
                theo: theo,
            }
        })
        await browser.close();
        console.log('done', path);
        rs.url = 'http://kenh14.vn' + path
        return rs

    } catch (e) {
        console.error(e);
        return {
            title: null,
            content: null,
            date: null,
            author: null,
            theo: null
        }
    }
}

async function crawl(a) {
    console.log("/home/ahcogn/data-" + a + ".txt");

    let urls = fs.readFileSync("/home/ahcogn/data-" + a + ".txt")
    let parsed = JSON.parse(urls)
    // parsed.every(async item =>{
    //     await getLinks(item.url)

    // })
    for (let i = 0; i < parsed.length; i++) {
        let data = await getLinks(parsed[i].url)
        if (i < parsed.length - 1) {
            data.cat = a
            fs.appendFileSync('/home/ahcogn/final-data' + a + '.txt', JSON.stringify(data) + ',')
        } else {
            data.cat = a
            fs.appendFileSync('/home/ahcogn/final-data' + a + '.txt', JSON.stringify(data) + ']')
        }

    }

}

async function a() {
    // await crawl('doi-song.chn')
    // await crawl('an-quay-di.chn')
    // await crawl('xa-hoi.chn')
    // await crawl('the-gioi.chn')
    await crawl('sport.chn')
    await crawl('hoc-duong.chn')
    await crawl('cine.chn')
    await crawl('tv-show.chn')
    await crawl('star.chn')
}
a()
