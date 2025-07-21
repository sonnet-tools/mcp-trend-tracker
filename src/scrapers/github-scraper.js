const axios = require('axios');
const { Database } = require('../database');
const logger = require('../utils/logger');

class GitHubScraper {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN;
    this.db = new Database();
    
    this.searchQueries = [
      'model context protocol',
      'mcp server',
      'mcp-server',
      'anthropic mcp',
      'model-context-protocol'
    ];
  }

  async scrape() {
    logger.info('🐙 Starting GitHub scraping...');
    
    try {
      const results = await Promise.all(
        this.searchQueries.map(query => this.searchRepositories(query))
      );

      const allRepos = results.flat();
      const uniqueRepos = this.deduplicateRepos(allRepos);
      
      logger.info(`Found ${uniqueRepos.length} unique MCP repositories`);
      
      await this.saveRepositories(uniqueRepos);
      await this.scrapeRepoDetails(uniqueRepos.slice(0, 50)); // Limit to avoid rate limits
      
      return { success: true, repos: uniqueRepos.length };
      
    } catch (error) {
      logger.error('GitHub scraper error:', error);
      throw error;
    }
  }

  async searchRepositories(query) {
    const response = await axios.get(`${this.baseURL}/search/repositories`, {
      params: {
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: 100
      },
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      topics: repo.topics || [],
      url: repo.html_url
    }));
  }

  async scrapeRepoDetails(repos) {
    logger.info('Fetching detailed repo information...');
    
    for (const repo of repos) {
      try {
        await this.delay(1000); // Rate limiting
        
        // Get contributors
        const contributors = await this.getContributors(repo.full_name);
        
        // Get languages
        const languages = await this.getLanguages(repo.full_name);
        
        // Get recent commits
        const commits = await this.getRecentCommits(repo.full_name);
        
        await this.db.saveRepoDetails(repo.id, {
          contributors: contributors.length,
          languages,
          recent_commits: commits.length,
          last_commit_date: commits[0]?.commit?.author?.date
        });
        
      } catch (error) {
        logger.warn(`Failed to get details for ${repo.full_name}:`, error.message);
      }
    }
  }

  async getContributors(fullName) {
    const response = await axios.get(`${this.baseURL}/repos/${fullName}/contributors`, {
      headers: { 'Authorization': `token ${this.token}` }
    });
    return response.data;
  }

  async getLanguages(fullName) {
    const response = await axios.get(`${this.baseURL}/repos/${fullName}/languages`, {
      headers: { 'Authorization': `token ${this.token}` }
    });
    return response.data;
  }

  async getRecentCommits(fullName) {
    const response = await axios.get(`${this.baseURL}/repos/${fullName}/commits`, {
      params: { per_page: 10 },
      headers: { 'Authorization': `token ${this.token}` }
    });
    return response.data;
  }

  deduplicateRepos(repos) {
    const seen = new Set();
    return repos.filter(repo => {
      if (seen.has(repo.id)) return false;
      seen.add(repo.id);
      return true;
    });
  }

  async saveRepositories(repos) {
    await this.db.saveRepositories(repos);
    logger.info(`Saved ${repos.length} repositories to database`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { GitHubScraper };