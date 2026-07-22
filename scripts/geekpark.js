const axios = require('axios');
const cheerio = require('cheerio');
const { Feed } = require('feed');

// 设置 axios 实例，带上默认请求头，防止被拦截
const client = axios.create({
  headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
});

async function scrapeGeekPark(keywords = ['散户', '汽车', '蔚来', '福特', '比亚迪', '特斯拉', '三菱', '纯电', '财务', '回购', '收购', '私募', '交易', '币安', '比特币', '加密货币', '广告', '任命', '政府', '盗版', 'edge', '股价', '市值', '估值', '逝世', '空客', '上市', '募资', '资产', '债券', '捐赠', 'WPS', 'windows']) {
  const targetUrl = 'https://www.geekpark.net/column/74';
  const { data } = await client.get(targetUrl);
  const $ = cheerio.load(data);
  
  const feed = new Feed({
    title: "极客早知道 - 极客公园",
    description: "极客公园 - 极客早知道专栏",
    id: targetUrl,
    link: targetUrl,
    language: "zh-CN",
    updated: new Date(),
  });

  // 获取列表 (这里的选择器还没改，只是留着框架)
  const items = $('#it_tech .info_list li');
  
  // 使用 for...of 循环来逐个抓取详情页
  for (let i = 0; i < Math.min(items.length, 25); i++) { // 抓前 25 条，避免运行过久
    const el = items[i];
    const link = $(el).find('.txt_area a').attr('href');
    const title = $(el).find('.txt_detail').text().trim();

    // --- 关键字过滤逻辑 ---
    let hasBlockedKeyword = false; // 默认不包含屏蔽词
    if (keywords && keywords.length > 0) {
      // 只要标题包含关键字数组中的任意一个词，就将其标记为匹配
      hasBlockedKeyword = keywords.some(keyword => title.includes(keyword));
    }

    if (title && link && !hasBlockedKeyword) {
      const fullLink = link.startsWith('http') ? link : `https://www.geekpark.net${link}`;
      
      try {
        // 1. 获取详情页内容
        const { data: detailHtml } = await client.get(fullLink);
        const $detail = cheerio.load(detailHtml);

        // --- 提取并转换真实发布时间 ---
        const timeMatch = detailHtml.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
        let articleDate = new Date(); 
        
        if (timeMatch) {
          const timeString = timeMatch[0].replace(' ', 'T') + '+08:00';
          const parsedDate = new Date(timeString);
          if (!isNaN(parsedDate.getTime())) {
            articleDate = parsedDate;
          }
        }

        // --- 提取作者/来源 ---
        let authorName = $detail('.article-byline > span').first().text();

        if (authorName) {
            authorName = authorName.replace(/[\s\xA0]+/g, '').trim();
        }
        
        if (!authorName) {
            authorName = "极客早知道";
        }
        
        // 2. 提取摘要
        const summary = $detail('.article-summ p').text().trim();
        
        // 3. 提取全文
        const summHtml = $detail('.article-summ p').html() || '';
        const contHtml = $detail('#artibody').html() || '';
        const fullContent = `<div>${summHtml}</div><div>${contHtml}</div>`;

        feed.addItem({
          title: title,
          id: fullLink,
          link: fullLink,
          description: summary,
          content: fullContent,
          author: [
            {
              name: authorName
            }
          ],
          date: articleDate,
        });
        
        // 简单延迟，防止被封 IP
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (e) {
        console.error(`抓取详情页失败: ${fullLink}`, e);
      }
    }
  }
  
  return feed.rss2();
}
module.exports = scrapeGeekPark;
