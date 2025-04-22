import puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';
import {getInstagramGraphqlData} from '../services/getInstagramGraphqlData';


export async function instagramFetch(user: string) {
  const browser = await puppeteer.launch({
    executablePath: executablePath(),
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  const base_url = "https://www.instagram.com/"


  await page.goto(base_url + user, { waitUntil: 'networkidle2' });

  // Wait for the post thumbnails to load
  await page.waitForSelector('article a', { timeout: 10000 });

  // Grab the first post link (the most recent post)
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

  // Call your GraphQL data fetcher
  const postData = await getInstagramGraphqlData(postUrl);
  console.log("GraphQL post data:", postData);

  await browser.close();
  return postData;
}
