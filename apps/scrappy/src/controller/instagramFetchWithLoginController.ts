import puppeteer, { Page } from 'puppeteer-core';
import { executablePath } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { getInstagramGraphqlData } from '../services/getInstagramGraphqlData';

const SESSION_FILE = path.resolve('./apps/scrappy/src/assets/instagram-session.json');
const INSTAGRAM_URL = 'https://www.instagram.com';

async function saveSession(page: Page) {
  const cookies = await page.cookies();
  const localStorageData = await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key) || '';
    }
    return data;
  });

  await fs.writeFile(SESSION_FILE, JSON.stringify({ cookies, localStorage: localStorageData }, null, 2));
}


async function loadSession(page: Page) {
  try {
    console.log("🔐 Loading Session...");

    const sessionStr = await fs.readFile(SESSION_FILE, 'utf8');
    const session = JSON.parse(sessionStr);

    // Set cookies
    await page.setCookie(...session.cookies);

    // Set localStorage
    await page.goto(INSTAGRAM_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate((data: Record<string, string>) => {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }
      }, session.localStorage);      

    await page.reload({ waitUntil: 'networkidle2' });
        console.log("✅ Session Loaded.");

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error loading session:", error.message);
      return false;
    } else {
      console.log("Unknown error loading session:", error);
      return false;
    }
  }
  
}

async function doLogin(page: Page) {
    await page.goto(INSTAGRAM_URL, { waitUntil: 'networkidle2' });

    if (await page.content()) {
      console.log("🔐 Logging in...");
      await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: 'networkidle2' });
    
      try {
          const dismissed = await page.$$eval('button', (buttons) => {
            for (const btn of buttons) {
              const text = btn.textContent?.trim();
              if (text === 'Recusar cookies opcionais') {
                (btn as HTMLElement).click();
                return true;
              }
            }
            return false;
          });
        
          if (dismissed) {
            console.log("✅ Cookie consent dismissed.");
            await new Promise(res => setTimeout(res, 1000));
          } else {
            console.log("⚠️ Cookie popup button not found.");
          }
        
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error("❌ Error dismissing cookie popup:", err.message);
          } else {
            console.error("❌ Unknown error:", err);
          }
        }      
  
    
      await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    
      await page.type('input[name="username"]', process.env.IG_USERNAME!, { delay: 50 });
      await page.type('input[name="password"]', process.env.IG_PASSWORD!, { delay: 50 });
    
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
    
      await saveSession(page); // <--- save session once logged in
    }  
}

export async function instagramFetchWithLogin(user: string) {
  const browser = await puppeteer.launch({
    executablePath: executablePath(),
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Try to load saved session
  if (!await loadSession(page)) {
    doLogin(page);
  }

  await page.goto(`${INSTAGRAM_URL}/${user}`, { waitUntil: 'networkidle2' });

  // Wait for post thumbnails
  await page.waitForSelector('article a', { timeout: 10000 });

  const postUrl = await page.$$eval('article a', anchors => {
    const href = anchors[0]?.getAttribute('href');
    return href ? `https://www.instagram.com${href}` : null;
  });

  if (!postUrl) {
    console.error("Could not find any post URL");
    await browser.close();
    return;
  }

  console.log("Most recent post URL:", postUrl);

  const postData = await getInstagramGraphqlData(postUrl);

  if (typeof postData === 'object' && postData !== null && 'sidecar' in postData) {
    postData.sidecar.forEach((edge : any, index : number) => {
      const node = edge.node;
      console.log(`Item ${index + 1}:`);
      console.log(`  Type: ${node.__typename}`);
      console.log(`  Is Video: ${node.is_video}`);
      console.log(`  Display URL: ${node.display_url}`);
      if (node.is_video) {
        console.log(`  Video URL: ${node.video_url}`);
      }
      console.log('-----------------------------');
    });
  } else {
    console.log("No sidecar content found.");
  }

  await browser.close();
  return postData;
}
