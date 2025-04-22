import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';


export async function instagramFetchWithLogin(user: string) {
  const browser = await puppeteer.launch({
    executablePath: executablePath(),
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Anti-bot evasion
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });


  await page.goto("https://www.instagram.com/", { waitUntil: 'networkidle2' });

// If not logged in, perform login
if ((await page.content()).includes("login")) {
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
  
  }
  

  await page.goto(`https://www.instagram.com/${user}/`, { waitUntil: 'networkidle2' });

  try {
    await page.waitForSelector('article a', { timeout: 10000 });
  } catch (e) {
    await browser.close();
    return { error: "Failed to load Instagram posts. Try again later." };
  }

  const postUrl = await page.$$eval('article a', anchors => {
    const href = anchors[0]?.getAttribute('href');
    return href ? `https://www.instagram.com${href}` : null;
  });

  if (!postUrl) {
    await browser.close();
    return { error: "No posts found for this user." };
  }

  const result = await page.evaluate(async (postUrl) => {
    const igId = postUrl.split('/p/')[1].replace('/', '');

    // Extract LSD token from global config or DOM
    const lsdMatch = document.body.innerHTML.match(/"lsd":"(.*?)"/);
    const lsd = lsdMatch ? lsdMatch[1] : '';

    const variables = {
      shortcode: igId
    };

    const doc_id = "10015901848480474";

    const response = await fetch(`https://www.instagram.com/api/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-LSD": lsd,
      },
      body: new URLSearchParams({
        lsd,
        variables: JSON.stringify(variables),
        doc_id,
      }).toString()
    });

    const json = await response.json();
    const items = json?.data?.xdt_shortcode_media;

    if (!items) return null;

    return {
      is_video: items?.is_video,
      sidecar: items?.edge_sidecar_to_children?.edges || null,
    };
  }, postUrl);

  await browser.close();
  return result;
}
