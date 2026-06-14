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
    description: "cnBeta.COM是互联网IT新闻业界的后起之秀,是国内领先的即时科技资讯站点和网友交流平台。消息速度快，报导立场公正中立，网友讨论气氛浓厚，在IT业界拥有独特的影响力。",
    id: targetUrl,
    link: targetUrl,
    language: "zh-CN",
    updated: new Date(),
  });

  $('.info_list li').each((i, el) => {
    const link = $(el).find('.txt_area a').attr('href');
    const title = $(el).find('.txt_detail').text().trim();
    if (title && link) {
      const fullLink = link.startsWith('http') ? link : `https://m.cnbeta.com.tw${link}`;
      feed.addItem({
        title: title,
        id: fullLink,
        link: fullLink,
        description: title,
        date: new Date(), 
      });
    }
  });
  return feed.rss2();
}
module.exports = scrapeCnbeta;
