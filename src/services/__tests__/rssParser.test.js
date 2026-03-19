import assert from 'node:assert/strict';

import { parseRssItems } from '../rssParser.js';

const cases = [
  {
    name: 'parses CDATA values and media:content image',
    run() {
      const xml = `
        <rss><channel>
          <item>
            <title><![CDATA[My &amp; Title]]></title>
            <link>https://example.com/a</link>
            <dc:creator><![CDATA[Author One]]></dc:creator>
            <pubDate>Tue, 19 Mar 2024 10:00:00 GMT</pubDate>
            <description><![CDATA[Hello &hellip; world]]></description>
            <category><![CDATA[Anime]]></category>
            <media:content url="https://img.example.com/a.jpg" />
          </item>
        </channel></rss>
      `;

      const [item] = parseRssItems(xml, { defaultAuthor: 'Fallback' });
      assert.equal(item.title, 'My & Title');
      assert.equal(item.link, 'https://example.com/a');
      assert.equal(item.author, 'Author One');
      assert.equal(item.description, 'Hello ... world');
      assert.deepEqual(item.categories, ['Anime']);
      assert.equal(item.image, 'https://img.example.com/a.jpg');
    },
  },
  {
    name: 'falls back to default author and extracts image from content:encoded',
    run() {
      const xml = `
        <rss><channel>
          <item>
            <title>News Two</title>
            <link>https://example.com/b</link>
            <pubDate>Mon, 18 Mar 2024 12:00:00 GMT</pubDate>
            <description>desc</description>
            <content:encoded><![CDATA[
              <p>Body</p>
              <img src="https://img.example.com/b.jpg" />
            ]]></content:encoded>
          </item>
        </channel></rss>
      `;

      const [item] = parseRssItems(xml, { defaultAuthor: 'Default Author' });
      assert.equal(item.author, 'Default Author');
      assert.equal(item.image, 'https://img.example.com/b.jpg');
    },
  },
  {
    name: 'uses enclosure image when media/content image is missing',
    run() {
      const xml = `
        <rss><channel>
          <item>
            <title>News Three</title>
            <guid>https://example.com/c-guid</guid>
            <description>desc</description>
            <enclosure url="https://img.example.com/c.jpg" />
          </item>
        </channel></rss>
      `;

      const [item] = parseRssItems(xml, { defaultAuthor: 'Fallback' });
      assert.equal(item.id, 'https://example.com/c-guid');
      assert.equal(item.image, 'https://img.example.com/c.jpg');
    },
  },
  {
    name: 'strips html from description and decodes numeric entities',
    run() {
      const xml = `
        <rss><channel>
          <item>
            <title>Entity Check</title>
            <description><![CDATA[<b>Tom &amp; Jerry &#038; Co &#34;Hi&#34;</b>]]></description>
          </item>
        </channel></rss>
      `;

      const [item] = parseRssItems(xml, { defaultAuthor: 'Fallback' });
      assert.equal(item.description, 'Tom & Jerry & Co "Hi"');
    },
  },
  {
    name: 'skips items without title and handles invalid payload safely',
    run() {
      const xml = `
        <rss><channel>
          <item>
            <link>https://example.com/no-title</link>
          </item>
          <item>
            <title>Valid One</title>
          </item>
        </channel></rss>
      `;

      const parsed = parseRssItems(xml, { defaultAuthor: 'Fallback' });
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].title, 'Valid One');
      assert.deepEqual(parseRssItems(null), []);
    },
  },
];

let passed = 0;
for (const testCase of cases) {
  try {
    testCase.run();
    passed += 1;
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  console.log(`All RSS parser regression tests passed (${passed}/${cases.length}).`);
}
