// Contact sheet: node tools/sheet.cjs out.png cols file1 file2 ...
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const [out, cols, ...files] = process.argv.slice(2);
  const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${path.basename(f, '.png')}</figcaption></figure>`).join('');
  const html = `<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px">${imgs}<style>figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:4px;top:2px;font:11px monospace;color:#ff0;background:#000a;padding:1px 4px}</style></body>`;
  const b = await chromium.launch({ channel: 'msedge' });
  const p = await b.newPage({ viewport: { width: Number(process.env.SHEET_W || 1800), height: 800 } });
  await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
