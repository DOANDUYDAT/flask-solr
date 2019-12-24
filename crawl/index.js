const puppeteer = require('puppeteer')
const fs = require('fs')


async function scrollToBottom(page) {
    const distance = 100
    const delay = 100
    while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
        await page.evaluate((y) => { document.scrollingElement.scrollBy(0, y); }, distance)
        await page.waitFor(delay)
    }
}

async function getLinks(path) {

    const browser = await puppeteer.launch()
    // const browser = await puppeteer.connect({
    //     browserWSEndpoint: 'ws://localhost:3000',
    // })
    const page = await browser.newPage()

    await page.setRequestInterception(true)
    page.on('request', (req) => {
        if(req.resourceType() === 'image'){
            req.abort()
        }
        else {
            req.continue()
        }
    })

    await page.goto('http://kenh14.vn/' + path, { waitUntil: 'networkidle0' })
    for (i = 1; i < 20; i++) {
        await scrollToBottom(page)
        await page
            .click('.view-more-detail > a')
            .catch(() => { })
        await page.click('a.load-more-tvl').catch(()=>{})
        await page.waitFor(3000)
    }
    await page.waitFor(3000)

    const urls = await page.evaluate(() => {
        let titleLinks = document.querySelectorAll('h3.knswli-title > a')
        if ([...titleLinks].length < 1) {
            titleLinks = document.querySelectorAll('a.title')
        }
        titleLinks = [...titleLinks];
        let urls = titleLinks.map(link => {
            return ({
                title: link.getAttribute('title'),
                url: link.getAttribute('href'),
            })
        });
        return urls
    });
    console.log('done'+ path);
    
    await browser.close()
    fs.writeFileSync('/home/ahcogn/data-' + path + '.txt', JSON.stringify(urls))
}
async function a() {
    await getLinks('doi-song.chn')
    await getLinks('an-quay-di.chn')
    await getLinks('xa-hoi.chn')
    await getLinks('the-gioi.chn')
    await getLinks('sport.chn')
    await getLinks('hoc-duong.chn')
    await getLinks('cine.chn')
    await getLinks('tv-show.chn')
    await getLinks('star.chn')
}

a()
