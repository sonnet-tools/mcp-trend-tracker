const { Database } = require('../src/database');
const fs = require('fs');
const path = require('path');

// Mock sqlite3
jest.mock('sqlite3', () => ({
  verbose: () => ({
    Database: jest.fn().mockImplementation(() => ({
      serialize: jest.fn(callback => callback()),
      run: jest.fn((query, params, callback) => {
        if (typeof params === 'function') callback = params;
        if (callback) callback(null);
      }),
      all: jest.fn((query, params, callback) => {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        if (callback) callback(null, []);
      }),
      close: jest.fn(callback => callback && callback())
    }))
  })
}));

describe('Database', () => {
  let db;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system operations
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockImplementation();
    
    db = new Database();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize database with correct path', () => {
      expect(db.dbPath).toContain('data/mcp-trends.db');
    });

    test('should create data directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      new Database();
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('data'),
        { recursive: true }
      );
    });
  });

  describe('saveRepositories', () => {
    test('should save repositories with correct data', async () => {
      const repos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          owner: 'user',
          description: 'A test repository',
          stars: 100,
          forks: 20,
          language: 'JavaScript',
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
          topics: ['mcp', 'ai'],
          url: 'https://github.com/user/test-repo'
        }
      ];

      await db.saveRepositories(repos);

      expect(db.db.run).toHaveBeenCalled();
      // Verify the prepared statement was used correctly
      const runCalls = db.db.run.mock.calls;
      expect(runCalls.some(call => 
        call[0].includes('INSERT OR REPLACE INTO repositories')
      )).toBe(true);
    });

    test('should handle empty repository array', async () => {
      await db.saveRepositories([]);
      
      // Should still prepare and finalize statement
      expect(db.db.run).toHaveBeenCalled();
    });
  });

  describe('saveNPMPackages', () => {
    test('should save NPM packages with score details', async () => {
      const packages = [
        {
          name: '@anthropic/mcp-server',
          version: '1.0.0',
          description: 'MCP server implementation',
          keywords: ['mcp', 'ai'],
          author: 'Anthropic',
          maintainers: 2,
          created: '2024-01-01',
          modified: '2024-01-02',
          npm_url: 'https://npmjs.com/package/@anthropic/mcp-server',
          homepage: 'https://modelcontextprotocol.io',
          repository: 'https://github.com/anthropics/mcp',
          score: {
            final: 0.95,
            detail: {
              quality: 0.9,
              popularity: 0.8,
              maintenance: 1.0
            }
          }
        }
      ];

      await db.saveNPMPackages(packages);

      expect(db.db.run).toHaveBeenCalled();
      const runCalls = db.db.run.mock.calls;
      expect(runCalls.some(call => 
        call[0].includes('INSERT OR REPLACE INTO npm_packages')
      )).toBe(true);
    });
  });

  describe('saveTrendMetric', () => {
    test('should save trend metrics correctly', async () => {
      await db.saveTrendMetric('github', 'total_repos', 150, '2024-01-01');

      expect(db.db.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trend_metrics'),
        ['github', 'total_repos', 150, '2024-01-01'],
        expect.any(Function)
      );
    });

    test('should handle database errors', async () => {
      db.db.run.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'));
      });

      await expect(db.saveTrendMetric('github', 'total_repos', 150, '2024-01-01'))
        .rejects.toThrow('Database error');
    });
  });

  describe('saveRedditPosts', () => {
    test('should save Reddit posts with all fields', async () => {
      const posts = [
        {
          id: 'abc123',
          title: 'MCP is amazing!',
          selftext: 'Just discovered Model Context Protocol...',
          subreddit: 'MachineLearning',
          author: 'techuser',
          score: 150,
          upvote_ratio: 0.95,
          num_comments: 25,
          created_utc: 1704067200,
          url: 'https://reddit.com/r/MachineLearning/comments/abc123/',
          permalink: '/r/MachineLearning/comments/abc123/',
          is_self: true,
          over_18: false,
          domain: 'self.MachineLearning'
        }
      ];

      await db.saveRedditPosts(posts);

      expect(db.db.run).toHaveBeenCalled();
      const runCalls = db.db.run.mock.calls;
      expect(runCalls.some(call => 
        call[0].includes('INSERT OR REPLACE INTO reddit_posts')
      )).toBe(true);
    });
  });

  describe('saveTwitterPosts', () => {
    test('should save Twitter posts with engagement metrics', async () => {
      const tweets = [
        {
          id: '1234567890',
          text: 'Excited about the Model Context Protocol! #MCP',
          created_at: '2024-01-01T12:00:00Z',
          author_id: '987654321',
          author_name: 'Tech Enthusiast',
          author_username: 'techenthusiast',
          author_verified: true,
          author_followers: 5000,
          retweet_count: 10,
          like_count: 50,
          reply_count: 5,
          quote_count: 2,
          language: 'en',
          context_annotations: [],
          url: 'https://twitter.com/techenthusiast/status/1234567890'
        }
      ];

      await db.saveTwitterPosts(tweets);

      expect(db.db.run).toHaveBeenCalled();
      const runCalls = db.db.run.mock.calls;
      expect(runCalls.some(call => 
        call[0].includes('INSERT OR REPLACE INTO twitter_posts')
      )).toBe(true);
    });
  });

  describe('close', () => {
    test('should close database connection', async () => {
      await db.close();
      
      expect(db.db.close).toHaveBeenCalled();
    });
  });
});