const { Database } = require('../database');
const moment = require('moment');
const logger = require('../utils/logger');

class TrendAnalyzer {
  constructor() {
    this.db = new Database();
  }

  async generateTrendReport() {
    logger.info('📊 Generating trend analysis report...');
    
    try {
      const report = {
        date: moment().format('YYYY-MM-DD'),
        github: await this.analyzeGitHubTrends(),
        npm: await this.analyzeNPMTrends(),
        social: await this.analyzeSocialTrends(),
        summary: {}
      };

      report.summary = this.generateSummary(report);
      
      await this.saveTrendMetrics(report);
      
      logger.info('✅ Trend analysis completed');
      return report;
      
    } catch (error) {
      logger.error('Trend analysis failed:', error);
      throw error;
    }
  }

  async analyzeGitHubTrends() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalRepos: `SELECT COUNT(*) as count FROM repositories`,
        totalStars: `SELECT SUM(stars) as total FROM repositories`,
        totalForks: `SELECT SUM(forks) as total FROM repositories`,
        topLanguages: `SELECT language, COUNT(*) as count FROM repositories WHERE language IS NOT NULL GROUP BY language ORDER BY count DESC LIMIT 10`,
        recentRepos: `SELECT COUNT(*) as count FROM repositories WHERE date(created_at) >= date('now', '-30 days')`,
        mostStarred: `SELECT full_name, stars FROM repositories ORDER BY stars DESC LIMIT 10`,
        growthRate: `
          SELECT 
            date(created_at) as date,
            COUNT(*) as daily_repos
          FROM repositories 
          WHERE date(created_at) >= date('now', '-90 days')
          GROUP BY date(created_at)
          ORDER BY date
        `
      };

      const results = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;

      queryKeys.forEach(key => {
        this.db.db.all(queries[key], (err, rows) => {
          if (err) {
            logger.error(`GitHub query ${key} failed:`, err);
            results[key] = null;
          } else {
            results[key] = key === 'totalRepos' || key === 'totalStars' || key === 'totalForks' || key === 'recentRepos'
              ? rows[0] 
              : rows;
          }
          
          completed++;
          if (completed === queryKeys.length) {
            resolve(results);
          }
        });
      });
    });
  }

  async analyzeNPMTrends() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalPackages: `SELECT COUNT(*) as count FROM npm_packages`,
        avgScore: `SELECT AVG(score_final) as avg_score FROM npm_packages WHERE score_final IS NOT NULL`,
        topPackages: `SELECT name, score_final FROM npm_packages ORDER BY score_final DESC LIMIT 10`,
        recentPackages: `SELECT COUNT(*) as count FROM npm_packages WHERE date(created) >= date('now', '-30 days')`,
        maintainerStats: `SELECT AVG(maintainers) as avg_maintainers, MAX(maintainers) as max_maintainers FROM npm_packages`
      };

      const results = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;

      queryKeys.forEach(key => {
        this.db.db.all(queries[key], (err, rows) => {
          if (err) {
            logger.error(`NPM query ${key} failed:`, err);
            results[key] = null;
          } else {
            results[key] = key === 'totalPackages' || key === 'avgScore' || key === 'recentPackages' || key === 'maintainerStats'
              ? rows[0] 
              : rows;
          }
          
          completed++;
          if (completed === queryKeys.length) {
            resolve(results);
          }
        });
      });
    });
  }

  async analyzeSocialTrends() {
    return new Promise((resolve, reject) => {
      const queries = {
        redditPosts: `SELECT COUNT(*) as count FROM reddit_posts`,
        redditEngagement: `SELECT AVG(score) as avg_score, SUM(num_comments) as total_comments FROM reddit_posts`,
        topSubreddits: `SELECT subreddit, COUNT(*) as posts FROM reddit_posts GROUP BY subreddit ORDER BY posts DESC LIMIT 10`,
        twitterPosts: `SELECT COUNT(*) as count FROM twitter_posts`,
        twitterEngagement: `SELECT AVG(like_count) as avg_likes, AVG(retweet_count) as avg_retweets FROM twitter_posts`,
        recentSocial: `
          SELECT 'reddit' as platform, COUNT(*) as count FROM reddit_posts WHERE date(scraped_at) >= date('now', '-7 days')
          UNION ALL
          SELECT 'twitter' as platform, COUNT(*) as count FROM twitter_posts WHERE date(scraped_at) >= date('now', '-7 days')
        `
      };

      const results = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;

      queryKeys.forEach(key => {
        this.db.db.all(queries[key], (err, rows) => {
          if (err) {
            logger.error(`Social query ${key} failed:`, err);
            results[key] = null;
          } else {
            results[key] = key === 'redditPosts' || key === 'redditEngagement' || key === 'twitterPosts' || key === 'twitterEngagement'
              ? rows[0] 
              : rows;
          }
          
          completed++;
          if (completed === queryKeys.length) {
            resolve(results);
          }
        });
      });
    });
  }

  generateSummary(report) {
    const summary = {
      totalActivity: 0,
      growthIndicators: [],
      keyMetrics: {},
      alerts: []
    };

    // Calculate total activity score
    if (report.github?.totalRepos?.count) {
      summary.totalActivity += report.github.totalRepos.count;
    }
    if (report.npm?.totalPackages?.count) {
      summary.totalActivity += report.npm.totalPackages.count;
    }
    if (report.social?.redditPosts?.count) {
      summary.totalActivity += report.social.redditPosts.count;
    }

    // Key metrics
    summary.keyMetrics = {
      repositories: report.github?.totalRepos?.count || 0,
      total_stars: report.github?.totalStars?.total || 0,
      npm_packages: report.npm?.totalPackages?.count || 0,
      reddit_discussions: report.social?.redditPosts?.count || 0,
      twitter_mentions: report.social?.twitterPosts?.count || 0
    };

    // Growth indicators
    if (report.github?.recentRepos?.count > 0) {
      summary.growthIndicators.push(`${report.github.recentRepos.count} new repos in last 30 days`);
    }
    if (report.npm?.recentPackages?.count > 0) {
      summary.growthIndicators.push(`${report.npm.recentPackages.count} new NPM packages in last 30 days`);
    }

    return summary;
  }

  async saveTrendMetrics(report) {
    const date = moment().format('YYYY-MM-DD');
    
    // Save key metrics
    const metrics = [
      ['github', 'total_repos', report.github?.totalRepos?.count || 0],
      ['github', 'total_stars', report.github?.totalStars?.total || 0],
      ['github', 'total_forks', report.github?.totalForks?.total || 0],
      ['npm', 'total_packages', report.npm?.totalPackages?.count || 0],
      ['social', 'reddit_posts', report.social?.redditPosts?.count || 0],
      ['social', 'twitter_posts', report.social?.twitterPosts?.count || 0],
      ['summary', 'total_activity', report.summary?.totalActivity || 0]
    ];

    for (const [type, name, value] of metrics) {
      try {
        await this.db.saveTrendMetric(type, name, value, date);
      } catch (error) {
        logger.warn(`Failed to save metric ${type}:${name}:`, error.message);
      }
    }
  }
}

module.exports = {
  TrendAnalyzer,
  generateTrendReport: async () => {
    const analyzer = new TrendAnalyzer();
    return await analyzer.generateTrendReport();
  }
};