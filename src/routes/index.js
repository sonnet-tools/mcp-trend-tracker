const express = require('express');
const { Database } = require('../database');
const { generateTrendReport } = require('../analytics/trend-analyzer');
const logger = require('../utils/logger');

function setupRoutes(app) {
  const router = express.Router();
  const db = new Database();

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get current trends
  router.get('/trends', async (req, res) => {
    try {
      const report = await generateTrendReport();
      res.json(report);
    } catch (error) {
      logger.error('Failed to generate trends:', error);
      res.status(500).json({ error: 'Failed to generate trends' });
    }
  });

  // Get repositories
  router.get('/repos', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'stars';
    const order = req.query.order || 'DESC';

    db.db.all(`
      SELECT * FROM repositories 
      ORDER BY ${sort} ${order} 
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        logger.error('Database query failed:', err);
        res.status(500).json({ error: 'Database query failed' });
      } else {
        res.json(rows);
      }
    });
  });

  // Get NPM packages
  router.get('/packages', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    db.db.all(`
      SELECT * FROM npm_packages 
      ORDER BY score_final DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, rows) => {
      if (err) {
        logger.error('Database query failed:', err);
        res.status(500).json({ error: 'Database query failed' });
      } else {
        res.json(rows);
      }
    });
  });

  // Get social media posts
  router.get('/social', (req, res) => {
    const platform = req.query.platform;
    const limit = parseInt(req.query.limit) || 50;

    if (platform === 'reddit') {
      db.db.all(`
        SELECT * FROM reddit_posts 
        ORDER BY created_utc DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          res.status(500).json({ error: 'Database query failed' });
        } else {
          res.json(rows);
        }
      });
    } else if (platform === 'twitter') {
      db.db.all(`
        SELECT * FROM twitter_posts 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          res.status(500).json({ error: 'Database query failed' });
        } else {
          res.json(rows);
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid platform. Use reddit or twitter.' });
    }
  });

  // Get summary statistics
  router.get('/stats', (req, res) => {
    const queries = {
      repos: `SELECT COUNT(*) as count, SUM(stars) as total_stars, SUM(forks) as total_forks FROM repositories`,
      packages: `SELECT COUNT(*) as count, AVG(score_final) as avg_score FROM npm_packages`,
      reddit: `SELECT COUNT(*) as count, AVG(score) as avg_score FROM reddit_posts`,
      twitter: `SELECT COUNT(*) as count, AVG(like_count) as avg_likes FROM twitter_posts`
    };

    const stats = {};
    let completed = 0;
    const queryKeys = Object.keys(queries);

    queryKeys.forEach(key => {
      db.db.get(queries[key], (err, row) => {
        if (!err) {
          stats[key] = row;
        }
        completed++;
        
        if (completed === queryKeys.length) {
          res.json(stats);
        }
      });
    });
  });

  // Get growth metrics
  router.get('/growth', (req, res) => {
    const days = parseInt(req.query.days) || 30;

    db.db.all(`
      SELECT 
        metric_type,
        metric_name,
        value,
        date
      FROM trend_metrics 
      WHERE date >= date('now', '-${days} days')
      ORDER BY date DESC, metric_type, metric_name
    `, (err, rows) => {
      if (err) {
        logger.error('Growth query failed:', err);
        res.status(500).json({ error: 'Database query failed' });
      } else {
        // Group by metric type and name
        const grouped = rows.reduce((acc, row) => {
          const key = `${row.metric_type}.${row.metric_name}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push({ date: row.date, value: row.value });
          return acc;
        }, {});

        res.json(grouped);
      }
    });
  });

  // Search functionality
  router.get('/search', (req, res) => {
    const query = req.query.q;
    const type = req.query.type || 'all';
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchTerm = `%${query}%`;
    const results = { repositories: [], packages: [], social: [] };
    let completed = 0;

    if (type === 'all' || type === 'repos') {
      db.db.all(`
        SELECT * FROM repositories 
        WHERE name LIKE ? OR description LIKE ? OR full_name LIKE ?
        ORDER BY stars DESC LIMIT 20
      `, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (!err) results.repositories = rows;
        completed++;
        if (completed === 3 || type === 'repos') res.json(results);
      });
    }

    if (type === 'all' || type === 'packages') {
      db.db.all(`
        SELECT * FROM npm_packages 
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY score_final DESC LIMIT 20
      `, [searchTerm, searchTerm], (err, rows) => {
        if (!err) results.packages = rows;
        completed++;
        if (completed === 3 || type === 'packages') res.json(results);
      });
    }

    if (type === 'all' || type === 'social') {
      db.db.all(`
        SELECT 'reddit' as platform, title, url, score FROM reddit_posts 
        WHERE title LIKE ? OR selftext LIKE ?
        UNION ALL
        SELECT 'twitter' as platform, text as title, url, like_count as score FROM twitter_posts 
        WHERE text LIKE ?
        ORDER BY score DESC LIMIT 20
      `, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (!err) results.social = rows;
        completed++;
        if (completed === 3 || type === 'social') res.json(results);
      });
    }

    if (type === 'repos' || type === 'packages' || type === 'social') {
      completed = 3; // Skip waiting for other queries
    }
  });

  app.use('/api', router);
  
  // Serve static files
  app.use(express.static('public'));
  
  // Catch-all handler for SPA routing
  app.get('*', (req, res) => {
    res.sendFile('mcp-trend.html', { root: process.cwd() });
  });
}

module.exports = { setupRoutes };