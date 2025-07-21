const { GitHubScraper } = require('./github-scraper');
const { NPMScraper } = require('./npm-scraper');
const { RedditScraper } = require('./reddit-scraper');
const { TwitterScraper } = require('./twitter-scraper');
const logger = require('../utils/logger');

class ScraperManager {
  constructor() {
    this.scrapers = [
      new GitHubScraper(),
      new NPMScraper(),
      new RedditScraper(),
      new TwitterScraper()
    ];
  }

  async startScrapers() {
    logger.info('Starting all scrapers...');
    
    const results = await Promise.allSettled(
      this.scrapers.map(scraper => scraper.scrape())
    );

    results.forEach((result, index) => {
      const scraperName = this.scrapers[index].constructor.name;
      if (result.status === 'fulfilled') {
        logger.info(`✅ ${scraperName} completed successfully`);
      } else {
        logger.error(`❌ ${scraperName} failed:`, result.reason);
      }
    });

    return results;
  }

  async getScraper(name) {
    return this.scrapers.find(scraper => 
      scraper.constructor.name.toLowerCase().includes(name.toLowerCase())
    );
  }
}

module.exports = {
  ScraperManager,
  startScrapers: async () => {
    const manager = new ScraperManager();
    return await manager.startScrapers();
  }
};