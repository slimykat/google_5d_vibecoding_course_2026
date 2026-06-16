/**
 * Coffee News & Production Report Query Tool
 * 
 * Fetches recent coffee bean production and supplier news:
 * 1. Dynamically constructs and verifies direct PDF links for the latest 
 *    International Coffee Organization (ICO) Monthly Coffee Market Reports.
 * 2. Fetches and parses the latest coffee market and supplier news from 
 *    Google News RSS without requiring external dependencies.
 */

const https = require('https');

// Helper to format Date as "Month Year" (e.g. "May 2026")
function formatMonthYear(date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Dynamically calculates the ICO Coffee Market Report PDF URL for a given date
function getIcoUrl(date) {
  const m = date.getMonth() + 1; // 1-12
  const y = date.getFullYear();
  const yy = String(y).slice(-2);
  const mm = String(m).padStart(2, '0');
  
  let folder;
  if (m >= 10) {
    folder = `cy${y}-${String(y + 1).slice(-2)}`;
  } else {
    folder = `cy${y - 1}-${yy}`;
  }
  
  return {
    label: formatMonthYear(date),
    url: `https://www.ico.org/documents/${folder}/cmr-${mm}${yy}-e.pdf`
  };
}

// Verifies if an ICO PDF link is active by sending an HTTP HEAD request
function checkLink(item) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(item.url);
    const options = {
      method: 'HEAD',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      timeout: 3000
    };

    const req = https.request(options, (res) => {
      resolve({
        ...item,
        status: res.statusCode === 200 ? 'Active' : 'Not Published Yet'
      });
    });

    req.on('error', () => {
      resolve({ ...item, status: 'Error Checking' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...item, status: 'Timeout' });
    });

    req.end();
  });
}

// Fetches recent news from Google News RSS feed
function fetchCoffeeNews() {
  return new Promise((resolve, reject) => {
    // Queries: "coffee production" or "coffee exports" or "coffee market" or "coffee supplier"
    const query = encodeURIComponent('"coffee bean production" OR "coffee supplier" OR "coffee export" OR "coffee market"');
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const items = [];
          // Simple regex to parse basic RSS feed tags without dependencies
          const itemMatches = data.match(/<item>([\s\S]*?)<\/item>/g);
          
          if (itemMatches) {
            for (const itemXml of itemMatches) {
              const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
              const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
              const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
              const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

              if (titleMatch && linkMatch) {
                // Remove source name from title if appended by Google News (e.g. "Title - Source")
                let title = titleMatch[1].trim();
                const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
                if (title.endsWith(` - ${source}`)) {
                  title = title.substring(0, title.length - (source.length + 3)).trim();
                }

                items.push({
                  title,
                  link: linkMatch[1].trim(),
                  pubDate: pubDateMatch ? new Date(pubDateMatch[1].trim()).toLocaleDateString() : 'N/A',
                  source
                });
              }
            }
          }
          resolve(items.slice(0, 10)); // Return top 10 articles
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('====================================================');
  console.log(' ☕ COFFEE BEAN PRODUCTION & SUPPLIER REPORT TOOL ☕');
  console.log('====================================================\n');

  // 1. Check official ICO Monthly Coffee Market Reports (Last 4 months)
  console.log('🔍 Checking Official International Coffee Organization (ICO) Reports...');
  const icoDates = [];
  const today = new Date();
  
  for (let i = 0; i < 4; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
    icoDates.push(getIcoUrl(d));
  }

  const results = await Promise.all(icoDates.map(checkLink));
  
  results.forEach(res => {
    const statusEmoji = res.status === 'Active' ? '✅' : '⏳';
    console.log(`- ${statusEmoji} [${res.label} Report]: ${res.status}`);
    if (res.status === 'Active') {
      console.log(`  🔗 PDF Link: ${res.url}`);
    }
  });

  console.log('\n----------------------------------------------------\n');

  // 2. Fetch recent trending news from Google News RSS
  console.log('📰 Fetching Trending Coffee Production & Supplier News...');
  try {
    const articles = await fetchCoffeeNews();
    if (articles.length === 0) {
      console.log('No recent news articles found.');
    } else {
      articles.forEach((art, index) => {
        console.log(`\n[${index + 1}] ${art.title}`);
        console.log(`    Source: ${art.source} | Date: ${art.pubDate}`);
        console.log(`    Link: ${art.link}`);
      });
    }
  } catch (err) {
    console.error('❌ Error fetching news:', err.message);
  }

  console.log('\n====================================================');
}

main();
