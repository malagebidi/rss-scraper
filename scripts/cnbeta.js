const axios = require('axios');
const cheerio = require('cheerio');
const { Feed } = require('feed');

async function scrapeCnbeta() {
  const targetUrl = 'https://m.cnbeta.com.tw/list/latest_1.htm';
  const { data } = await axios.get(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
  });
  const $ = cheerio.load(data);
  const feed = new Feed({
    title: "cnBeta 业界资讯",
    description: "自动抓取的 cnBeta 资讯",
    id: targetUrl,
    link: targetUrl,
    language: "zh-CN",
    updated: new Date(),
  });

  $('.list_area .item').each((i, el) => {
    const link = $(el).find('a').attr('href');
    const title = $(el).find('.tit').text().trim();
    const summary = $(el).find('.summary').text().trim(); 
    if (title && link) {
      const fullLink = link.startsWith('http') ? link : `https://m.cnbeta.com.tw${link}`;
      feed.addItem({
        title: title,
        id: fullLink,
        link: fullLink,
        description: summary || title,
        date: new Date(), 
      });
    }
  });
  return feed.rss2();
}
module.exports = scrapeCnbeta;
