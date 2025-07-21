const { GitHubScraper } = require('../src/scrapers/github-scraper');
const { NPMScraper } = require('../src/scrapers/npm-scraper');
const { ScraperManager } = require('../src/scrapers');

// Mock external dependencies
jest.mock('axios');
jest.mock('../src/database');
jest.mock('../src/utils/logger');

describe('Scrapers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GitHubScraper', () => {
    test('should initialize with correct configuration', () => {
      const scraper = new GitHubScraper();
      
      expect(scraper.baseURL).toBe('https://api.github.com');
      expect(scraper.searchQueries).toContain('model context protocol');
      expect(scraper.searchQueries).toContain('mcp server');
    });

    test('should deduplicate repositories correctly', () => {
      const scraper = new GitHubScraper();
      const repos = [
        { id: 1, name: 'repo1' },
        { id: 2, name: 'repo2' },
        { id: 1, name: 'repo1-duplicate' },
        { id: 3, name: 'repo3' }
      ];

      const unique = scraper.deduplicateRepos(repos);
      
      expect(unique).toHaveLength(3);
      expect(unique.map(r => r.id)).toEqual([1, 2, 3]);
    });

    test('should handle API errors gracefully', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('API Error'));

      const scraper = new GitHubScraper();
      
      await expect(scraper.scrape()).rejects.toThrow('API Error');
    });
  });

  describe('NPMScraper', () => {
    test('should initialize with correct search terms', () => {
      const scraper = new NPMScraper();
      
      expect(scraper.searchTerms).toContain('mcp');
      expect(scraper.searchTerms).toContain('model-context-protocol');
      expect(scraper.baseURL).toBe('https://registry.npmjs.org');
    });

    test('should deduplicate packages correctly', () => {
      const scraper = new NPMScraper();
      const packages = [
        { name: 'package1', version: '1.0.0' },
        { name: 'package2', version: '2.0.0' },
        { name: 'package1', version: '1.1.0' },
        { name: 'package3', version: '1.0.0' }
      ];

      const unique = scraper.deduplicatePackages(packages);
      
      expect(unique).toHaveLength(3);
      expect(unique.map(p => p.name)).toEqual(['package1', 'package2', 'package3']);
    });
  });

  describe('ScraperManager', () => {
    test('should initialize with all scrapers', () => {
      const manager = new ScraperManager();
      
      expect(manager.scrapers).toHaveLength(4);
      expect(manager.scrapers[0]).toBeInstanceOf(GitHubScraper);
      expect(manager.scrapers[1]).toBeInstanceOf(NPMScraper);
    });

    test('should find scraper by name', async () => {
      const manager = new ScraperManager();
      
      const githubScraper = await manager.getScraper('github');
      expect(githubScraper).toBeInstanceOf(GitHubScraper);

      const npmScraper = await manager.getScraper('npm');
      expect(npmScraper).toBeInstanceOf(NPMScraper);
    });

    test('should handle scraper failures', async () => {
      const manager = new ScraperManager();
      
      // Mock scraper failure
      manager.scrapers[0].scrape = jest.fn().mockRejectedValue(new Error('Scraper failed'));
      manager.scrapers[1].scrape = jest.fn().mockResolvedValue({ success: true });
      manager.scrapers[2].scrape = jest.fn().mockResolvedValue({ success: true });
      manager.scrapers[3].scrape = jest.fn().mockResolvedValue({ success: true });

      const results = await manager.startScrapers();
      
      expect(results).toHaveLength(4);
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
      expect(results[3].status).toBe('fulfilled');
    });
  });
});