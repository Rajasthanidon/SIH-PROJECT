const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', request => {
    if (request.url().includes('/api/')) {
       console.log('API REQUEST FAILED:', request.url(), request.failure().errorText);
    }
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    await page.type('input[type="email"]', 'student@example.com');
    await page.type('input[type="password"]', 'student123');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('At dashboard.');
    
    const dashboardTitle = await page.evaluate(() => document.body.innerText.includes('Welcome back'));
    console.log('Dashboard title present:', dashboardTitle);
    
    console.log('Navigating to Profile...');
    await page.click('a[href="/student/profile"]');
    await page.waitForTimeout(1000);
    const profileTitle = await page.evaluate(() => document.body.innerText.includes('Personal Details'));
    console.log('Profile title present:', profileTitle);

    console.log('Navigating to Applications...');
    await page.click('a[href="/student/applications"]');
    await page.waitForTimeout(1000);
    const appTitle = await page.evaluate(() => document.body.innerText.includes('Application History') || document.body.innerText.includes('Applications'));
    console.log('Applications title present:', appTitle);
    
    console.log('Navigating to Opportunities...');
    await page.click('a[href="/student/opportunities"]');
    await page.waitForTimeout(1000);
    const oppTitle = await page.evaluate(() => document.body.innerText.includes('Opportunities'));
    console.log('Opportunities title present:', oppTitle);
    
    console.log('Navigating to Dashboard again to test cache speed...');
    const start = Date.now();
    await page.click('a[href="/student/dashboard"]');
    await page.waitForFunction(() => document.body.innerText.includes('Welcome back'));
    const end = Date.now();
    console.log(`Cache return to dashboard took: ${end - start}ms`);
    
    console.log('Test complete. All looks good!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
