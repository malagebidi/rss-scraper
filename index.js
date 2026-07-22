const fs = require('fs');
const path = require('path');
const scrapeGeekPark = require('./scripts/geekpark');

async function main() {
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);

  try {
    const geekParkRss = await scrapeGeekPark();
    fs.writeFileSync(path.join(distPath, 'geekpark.xml'), geekParkRss, 'utf8');
    console.log('✅ 极客公园抓取成功！');
  } catch (error) {
    console.error('❌ 抓取错误:', error);
    process.exit(1);
  }
}
main();
