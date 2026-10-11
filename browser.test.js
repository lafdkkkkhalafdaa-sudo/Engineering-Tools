// Optional UI checks: requires Playwright and an installed Chromium browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

test('Arabic interface, automatic calculations and invalid input recovery', async () => {
  const server = createServer(async (request, response) => {
    const file = {'/': 'index.html', '/index.html': 'index.html', '/pool.html': 'pool.html', '/concrete.html': 'concrete.html', '/concrete.css': 'concrete.css', '/concrete.js': 'concrete.js', '/styles.css': 'styles.css', '/calculator.js': 'calculator.js'}[request.url];
    if (!file) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
    response.end(await readFile(path.join(__dirname, file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
    assert.equal(await page.title(), 'أدوات المهندس');
    assert.equal(await page.locator('.tool-card').count(), 5);
    assert.equal(await page.locator('.soon').count(), 3);
    assert.equal(await page.locator('.tool-card a, a.tool-card').count(), 2);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.getByRole('link', { name: /المسابح/ }).click();
    assert.equal(await page.title(), 'حاسبة كميات المسبح');
    const format = number => new Intl.NumberFormat('ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
    for (const [id, expected] of Object.entries({averageDepth: 1.3, volume: 27.3, floor: 21.10473880435387, walls: 24.7, total: 45.80473880435387})) {
      assert.equal(await page.locator(`#${id}`).textContent(), format(expected));
    }
    await page.locator('[name=length]').fill('12');
    assert.equal(await page.locator('#volume').textContent(), format(54.6));
    await page.locator('[name=deep]').fill('0.5');
    assert.ok(await page.locator('#error').isVisible());
    assert.ok(await page.locator('#results').isHidden());
    await page.locator('[name=deep]').fill('1');
    assert.ok(await page.locator('#results').isVisible());
    assert.equal(await page.locator('#floor').textContent(), format(42));
    await page.locator('[name=width]').fill('');
    assert.ok(await page.locator('#results').isHidden());
    await page.locator('[name=width]').fill('3.5');
    assert.ok(await page.locator('#results').isVisible());
    await page.getByRole('button', { name: 'احسب الكميات' }).click();
    assert.ok(await page.locator('#results').isVisible());
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.getByRole('link', { name: /العودة إلى الصفحة الرئيسية/ }).click();
    assert.equal(await page.title(), 'أدوات المهندس');
    await page.getByRole('link', {name: /الخرسانة المسلحة/}).click();
    assert.equal(await page.title(), 'حاسبة الخرسانة المسلحة');
    assert.equal(await page.locator('.concrete-form').count(), 7);
    const form = page.locator('.concrete-form').first();
    for (const [key,value] of Object.entries({count:'2', length:'2', width:'3', thickness:'0.5'})) await form.locator(`[name=${key}]`).fill(value);
    await form.getByRole('button', {name:'إضافة للحصر'}).click();
    assert.equal(await page.locator('#concrete-total').textContent(), format(6));
    await form.locator('[name=length]').fill('4');
    await form.getByRole('button', {name:'إضافة للحصر'}).click();
    assert.equal(await page.locator('#quantity-rows tr').count(), 2);
    assert.equal(await page.locator('#concrete-total').textContent(), format(18));
    for (const value of ['0','-1','','1.5']) {
      await form.locator('[name=count]').fill(value);
      await form.getByRole('button', {name:'إضافة للحصر'}).click();
      assert.ok(await form.locator('[role=alert]').isVisible());
      assert.equal(await page.locator('#quantity-rows tr').count(), 2);
    }
    await page.locator('#quantity-rows button').first().click();
    assert.equal(await page.locator('#concrete-total').textContent(), format(12));
    await page.locator('#quantity-rows button').click();
    assert.equal(await page.locator('#concrete-total').textContent(), format(0));
    assert.ok(await page.locator('#empty-list').isVisible());
    for (const width of [390,1280]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.getByRole('link',{name:/العودة إلى أدوات المهندس/}).click();
    assert.equal(await page.title(), 'أدوات المهندس');
    await page.goto(`http://127.0.0.1:${server.address().port}/pool.html`);
    assert.ok(await page.locator('#results').isVisible());
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
