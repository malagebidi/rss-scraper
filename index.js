const fs = require('fs');
const path = require('path');
const scrapeCnbeta = require('./scripts/cnbeta');

async function main() {
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);

  try {
    const cnbetaRss = await scrapeCnbeta();
    fs.writeFileSync(path.join(distPath, 'cnbeta.xml'), cnbetaRss, 'utf8');
    console.log('✅ cnBeta 抓取成功！');
  } catch (error) {
    console.error('❌ 抓取错误:', error);
    process.exit(1);
  }
}
main();
