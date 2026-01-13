import express from 'express';
//import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';


// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Optional: allow CORS globally
//app.use(cors());

app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    res.set('Content-Type', contentType);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Failed to fetch image');
  }
});

app.get('/openstax-title', async (req, res) => {
  const openstaxURL = req.query.url;
  if (!openstaxURL) return res.status(400).send('Missing URL');
  try {

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(openstaxURL);

    const selector = 'div.content.book-title h1.image-heading img';
    const imgElement = await page.$(selector);

    let title;

    if (imgElement) {
      title = await page.$eval(selector, img => img?.getAttribute('alt'));
    } else {
      title = await page.title();
      title = title.substring(title.indexOf(' - ') + 3, title.indexOf(' | OpenStax'));
    }
    console.log('OpenStax title:', title);

    await browser.close();
    res.json({ title });
  } catch (err) {
    console.error('Error fetching OpenStax title:', err);
    res.status(500).send('Failed to fetch OpenStax title');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
