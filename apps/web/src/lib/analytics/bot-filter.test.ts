import { describe, expect, it } from 'vitest';
import { isObviousAnalyticsBot } from './bot-filter';

describe('WS08-T005 basic bot filtering', () => {
  it('ignores representative crawlers and monitors', () => {
    const blocked = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Twitterbot/1.0',
      'LinkedInBot/1.0',
      'SomethingBot/1.0',
      'SiteCrawler/2.0',
      'WebSpider/3.0',
      'UptimeRobot/2.0',
      'Pingdom.com_bot_version_1.4',
    ];
    for (const ua of blocked) {
      expect(isObviousAnalyticsBot(ua), ua).toBe(true);
    }
  });

  it('accepts normal browsers including mobile and privacy-oriented examples', () => {
    const allowed = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
      '',
      null,
      undefined,
    ];
    for (const ua of allowed) {
      expect(isObviousAnalyticsBot(ua), String(ua)).toBe(false);
    }
  });
});
