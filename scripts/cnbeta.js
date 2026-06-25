const axios = require('axios');
const cheerio = require('cheerio');
const { Feed } = require('feed');

// 设置 axios 实例，带上默认请求头，防止被拦截
const client = axios.create({
  headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
});

async function scrapeCnbeta(keywords = ['散户', '汽车', '特斯拉', '纯电', '财务', '回购', '收购', '交易', '广告', '任命', '盗版', 'edge', '股价', '市值', '估值', '逝世', '空客', '上市', '募资', '资产', '债券', 'WPS']) {
  const targetUrl = 'https://m.cnbeta.com.tw/';
  const { data } = await client.get(targetUrl);
  const $ = cheerio.load(data);
  
  const feed = new Feed({
    title: "cnBeta 业界资讯",
    description: "cnBeta.COM是互联网IT新闻业界的后起之秀,是国内领先的即时科技资讯站点和网友交流平台。消息速度快，报导立场公正中立，网友讨论气氛浓厚，在IT业界拥有独特的影响力。",
    id: targetUrl,
    link: targetUrl,
    language: "zh-CN",
    updated: new Date(),
  });

  // 获取列表
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
      const fullLink = link.startsWith('http') ? link : `https://m.cnbeta.com.tw${link}`;
      
      try {
        // 1. 获取详情页内容
        const { data: detailHtml } = await client.get(fullLink);
        const $detail = cheerio.load(detailHtml);

        // --- 新增：提取并转换真实发布时间 ---
        // 使用正则直接提取 "2026-06-19 01:46:27" 这种格式的字符串
        const timeMatch = detailHtml.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
        let articleDate = new Date(); // 默认使用当前时间兜底
        
        if (timeMatch) {
          // 将空格替换为 T，并补上北京时间后缀，拼成符合 ISO 8601 标准的格式
          // 最终拼成：2026-06-19T01:46:27+08:00
          const timeString = timeMatch[0].replace(' ', 'T') + '+08:00';
          const parsedDate = new Date(timeString);
          
          // 校验日期是否合法，合法才替换
          if (!isNaN(parsedDate.getTime())) {
            articleDate = parsedDate;
          }
        }

        // --- 新增：提取作者/来源 ---
        let authorName = $detail('.article-byline > span').first().text();

        if (authorName) {
            // Cheerio 的 .text() 会把底下的 "&nbsp;&nbsp;" 也抓出来（变成特殊的空白字符 \xA0）
            // 我们用正则把所有普通空格和不可见的实体空格全部替换掉，并去除首尾空白
            authorName = authorName.replace(/[\s\xA0]+/g, '').trim();
        }
        
        // 兜底逻辑，如果没抓到具体的作者，就默认显示 "cnBeta"
        if (!authorName) {
            authorName = "cnBeta 业界资讯";
        }
        
        // 2. 提取摘要：单独提取 .article-summ
        const summary = $detail('.article-summ p').text().trim();
        
        // 3. 提取全文：拼接摘要和正文内容
        // 我们先拿到两部分的 HTML，然后拼接在一起
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
module.exports = scrapeCnbeta;
