const axios = require('axios');
const { Database } = require('../database');
const logger = require('../utils/logger');

class TwitterScraper {
  constructor() {
    this.baseURL = 'https://api.twitter.com/2';
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.db = new Database();
    
    this.searchQueries = [
      'model context protocol',
      '#MCP',
      '@AnthropicAI MCP',
      'mcp server',
      'anthropic mcp'
    ];
  }

  async scrape() {
    logger.info('🐦 Starting Twitter scraping...');
    
    if (!this.bearerToken) {
      logger.warn('No Twitter Bearer Token provided, skipping Twitter scraping');
      return { success: false, reason: 'No API token' };
    }
    
    try {
      const results = await Promise.all(
        this.searchQueries.map(query => this.searchTweets(query))
      );

      const allTweets = results.flat();
      const uniqueTweets = this.deduplicateTweets(allTweets);
      
      logger.info(`Found ${uniqueTweets.length} unique tweets about MCP`);
      
      await this.saveTweets(uniqueTweets);
      
      return { success: true, tweets: uniqueTweets.length };
      
    } catch (error) {
      logger.error('Twitter scraper error:', error);
      throw error;
    }
  }

  async searchTweets(query) {
    try {
      await this.delay(1000); // Rate limiting
      
      const response = await axios.get(`${this.baseURL}/tweets/search/recent`, {
        params: {
          query: `${query} -is:retweet lang:en`,
          'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,lang',
          'user.fields': 'name,username,verified,public_metrics',
          'expansions': 'author_id',
          max_results: 100
        },
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parseTweets(response.data);
    } catch (error) {
      if (error.response?.status === 429) {
        logger.warn('Twitter API rate limit exceeded, waiting...');
        await this.delay(15 * 60 * 1000); // Wait 15 minutes
        return this.searchTweets(query);
      }
      logger.warn(`Failed to search Twitter for "${query}":`, error.message);
      return [];
    }
  }

  parseTweets(data) {
    if (!data.data) return [];

    const users = {};
    if (data.includes?.users) {
      data.includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    return data.data.map(tweet => {
      const author = users[tweet.author_id] || {};
      
      return {
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author_id: tweet.author_id,
        author_name: author.name,
        author_username: author.username,
        author_verified: author.verified,
        author_followers: author.public_metrics?.followers_count || 0,
        retweet_count: tweet.public_metrics?.retweet_count || 0,
        like_count: tweet.public_metrics?.like_count || 0,
        reply_count: tweet.public_metrics?.reply_count || 0,
        quote_count: tweet.public_metrics?.quote_count || 0,
        language: tweet.lang,
        context_annotations: tweet.context_annotations || [],
        url: `https://twitter.com/${author.username}/status/${tweet.id}`
      };
    });
  }

  deduplicateTweets(tweets) {
    const seen = new Set();
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) return false;
      seen.add(tweet.id);
      return true;
    });
  }

  async saveTweets(tweets) {
    await this.db.saveTwitterPosts(tweets);
    logger.info(`Saved ${tweets.length} tweets to database`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { TwitterScraper };