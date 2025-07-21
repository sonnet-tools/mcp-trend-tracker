const axios = require('axios');
const { Database } = require('../database');
const logger = require('../utils/logger');

class NPMScraper {
  constructor() {
    this.baseURL = 'https://registry.npmjs.org';
    this.searchURL = 'https://api.npms.io/v2/search';
    this.db = new Database();
    
    this.searchTerms = [
      'mcp',
      'model-context-protocol',
      'mcp-server',
      'anthropic-mcp'
    ];
  }

  async scrape() {
    logger.info('📦 Starting NPM scraping...');
    
    try {
      const results = await Promise.all(
        this.searchTerms.map(term => this.searchPackages(term))
      );

      const allPackages = results.flat();
      const uniquePackages = this.deduplicatePackages(allPackages);
      
      logger.info(`Found ${uniquePackages.length} unique MCP-related packages`);
      
      await this.savePackages(uniquePackages);
      
      return { success: true, packages: uniquePackages.length };
      
    } catch (error) {
      logger.error('NPM scraper error:', error);
      throw error;
    }
  }

  async searchPackages(term) {
    try {
      const response = await axios.get(this.searchURL, {
        params: {
          q: term,
          size: 100
        }
      });

      return response.data.results.map(pkg => ({
        name: pkg.package.name,
        version: pkg.package.version,
        description: pkg.package.description,
        keywords: pkg.package.keywords || [],
        author: pkg.package.author?.name || 'Unknown',
        maintainers: pkg.package.maintainers?.length || 0,
        created: pkg.package.date,
        modified: pkg.package.date,
        npm_url: `https://www.npmjs.com/package/${pkg.package.name}`,
        homepage: pkg.package.links?.homepage,
        repository: pkg.package.links?.repository,
        score: {
          final: pkg.score.final,
          detail: {
            quality: pkg.score.detail.quality,
            popularity: pkg.score.detail.popularity,
            maintenance: pkg.score.detail.maintenance
          }
        }
      }));
    } catch (error) {
      logger.warn(`Failed to search NPM for term "${term}":`, error.message);
      return [];
    }
  }

  async getPackageDetails(packageName) {
    try {
      const response = await axios.get(`${this.baseURL}/${packageName}`);
      const data = response.data;
      
      return {
        downloads: await this.getDownloadStats(packageName),
        versions: Object.keys(data.versions || {}).length,
        latest_version: data['dist-tags']?.latest,
        dependencies: Object.keys(data.versions?.[data['dist-tags']?.latest]?.dependencies || {}).length,
        dev_dependencies: Object.keys(data.versions?.[data['dist-tags']?.latest]?.devDependencies || {}).length
      };
    } catch (error) {
      logger.warn(`Failed to get details for package ${packageName}:`, error.message);
      return null;
    }
  }

  async getDownloadStats(packageName) {
    try {
      const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
      return response.data.downloads;
    } catch (error) {
      return 0;
    }
  }

  deduplicatePackages(packages) {
    const seen = new Set();
    return packages.filter(pkg => {
      if (seen.has(pkg.name)) return false;
      seen.add(pkg.name);
      return true;
    });
  }

  async savePackages(packages) {
    await this.db.saveNPMPackages(packages);
    logger.info(`Saved ${packages.length} NPM packages to database`);
  }
}

module.exports = { NPMScraper };