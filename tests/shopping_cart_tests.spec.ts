import { test, expect } from '@playwright/test';

test('TC025: Compatibility testing ', async ({ page }) => {

  await page.goto('http://localhost:3000');  
  await expect(page).toHaveTitle(/Typescript React Shopping cart/);

});

test('TC021: Test homepage response time', async ({ page }) => {

    const minResponseTime = 1000;
  
    //calcualting response time
    const startT = Date.now();
    await page.goto('http://localhost:3000'); 
    const endT = Date.now();
    const responseTime = endT - startT;
    console.log(`Response time: ${responseTime} ms`);
    
    expect(responseTime).toBeLessThanOrEqual(minResponseTime);
  });


