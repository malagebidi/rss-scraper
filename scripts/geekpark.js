const axios = require('axios');
const cheerio = require('cheerio');
const { Feed } = require('feed');

// 设置 axios 实例，带上默认请求头，防止被拦截
const client = axios.create({
  headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
});

async function scrapeGeekPark(keywords = ['散户飞到费佛瑞']) {
  const targetUrl = 'https://www.geekpark.net/column/74';
  const { data } = await client.get(targetUrl);
  const $ = cheerio.load(data);
  
  const feed = new Feed({
    title: "极客早知道",
    description: "第一时间掌握最新科技资讯",
    id: targetUrl,
    link: targetUrl,
    language: "zh-CN",
    updated: new Date(),
  });

  // 获取列表 (这里的选择器还没改，只是留着框架)
  const items = $('.article-list > article');
  
  // 使用 for...of 循环来逐个抓取详情页
  for (let i = 0; i < Math.min(items.length, 15); i++) { // 抓前 15 条，避免运行过久
    const el = items[i];
    const link = $(el).find('.img-cover-wrap').attr('href');
    const title = $(el).find('h3.multiline-text-overflow').text().trim();

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
        const authorName = "极客早知道";
        
        // 2. 提取封面图和摘要
        const coverImage = $detail('img#topic-cover').attr('src');
        const summary = $detail('.topic-cover > p').text().trim();
        
        // 3. 提取全文
        const fullContent = $detail('.article-content').html() || '';

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
          image: coverImage,
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
