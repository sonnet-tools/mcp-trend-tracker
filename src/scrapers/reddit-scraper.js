const axios = require('axios');
const { Database } = require('../database');
const logger = require('../utils/logger');

class RedditScraper {
  constructor() {
    this.baseURL = 'https://www.reddit.com';
    this.db = new Database();
    
    this.subreddits = [
      'MachineLearning',
      'artificial', 
      'ChatGPT',
      'OpenAI',
      'LocalLLaMA',
      'singularity',
      'programming'
    ];
    
    this.searchTerms = [
      'model context protocol',
      'MCP',
      'anthropic mcp',
      'mcp server'
    ];
  }

  async scrape() {
    logger.info('🤖 Starting Reddit scraping...');
    
    try {
      const results = await Promise.all([
        ...this.subreddits.map(sub => this.searchSubreddit(sub)),
        ...this.searchTerms.map(term => this.searchReddit(term))
      ]);

      const allPosts = results.flat();
      const uniquePosts = this.deduplicatePosts(allPosts);
      
      logger.info(`Found ${uniquePosts.length} unique Reddit posts about MCP`);
      
      await this.savePosts(uniquePosts);
      
      return { success: true, posts: uniquePosts.length };
      
    } catch (error) {
      logger.error('Reddit scraper error:', error);
      throw error;
    }
  }

  async searchSubreddit(subreddit) {
    try {
      await this.delay(1000); // Rate limiting
      
      const response = await axios.get(`${this.baseURL}/r/${subreddit}/search.json`, {
        params: {
          q: 'model context protocol OR MCP OR anthropic',
          restrict_sr: true,
          sort: 'new',
          limit: 25
        },
        headers: {
          'User-Agent': 'MCP-Trend-Tracker/1.0'
        }
      });

      return this.parsePosts(response.data.data.children, subreddit);
    } catch (error) {
      logger.warn(`Failed to search subreddit r/${subreddit}:`, error.message);
      return [];
    }
  }

  async searchReddit(term) {
    try {
      await this.delay(1000); // Rate limiting
      
      const response = await axios.get(`${this.baseURL}/search.json`, {
        params: {
          q: term,
          sort: 'new',
          limit: 25
        },
        headers: {
          'User-Agent': 'MCP-Trend-Tracker/1.0'
        }
      });

      return this.parsePosts(response.data.data.children);
    } catch (error) {
      logger.warn(`Failed to search Reddit for "${term}":`, error.message);
      return [];
    }
  }

  parsePosts(children, subreddit = null) {
    return children.map(child => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        selftext: post.selftext,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        upvote_ratio: post.upvote_ratio,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        is_self: post.is_self,
        over_18: post.over_18,
        domain: post.domain
      };
    }).filter(post => 
      // Filter for MCP-related content
      this.isMCPRelated(post.title) || this.isMCPRelated(post.selftext)
    );
  }

  isMCPRelated(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return lowerText.includes('model context protocol') ||
           lowerText.includes('mcp') ||
           lowerText.includes('anthropic') ||
           (lowerText.includes('model') && lowerText.includes('context'));
  }

  deduplicatePosts(posts) {
    const seen = new Set();
    return posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }

  async savePosts(posts) {
    await this.db.saveRedditPosts(posts);
    logger.info(`Saved ${posts.length} Reddit posts to database`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RedditScraper };