// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.DATABASE_URL = ':memory:';
  
  // Mock console to reduce noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

afterAll(() => {
  // Cleanup after all tests
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Global test utilities
global.createMockRepo = (overrides = {}) => ({
  id: 123456,
  name: 'mcp-test-repo',
  full_name: 'user/mcp-test-repo',
  owner: 'user',
  description: 'A test MCP repository',
  stars: 100,
  forks: 25,
  language: 'JavaScript',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  topics: ['mcp', 'ai'],
  url: 'https://github.com/user/mcp-test-repo',
  ...overrides
});

global.createMockPackage = (overrides = {}) => ({
  name: '@test/mcp-package',
  version: '1.0.0',
  description: 'A test MCP package',
  keywords: ['mcp', 'test'],
  author: 'Test Author',
  maintainers: 1,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
  npm_url: 'https://npmjs.com/package/@test/mcp-package',
  score: {
    final: 0.8,
    detail: {
      quality: 0.7,
      popularity: 0.6,
      maintenance: 0.9
    }
  },
  ...overrides
});

global.createMockRedditPost = (overrides = {}) => ({
  id: 'test123',
  title: 'Test MCP Discussion',
  selftext: 'This is a test post about MCP',
  subreddit: 'MachineLearning',
  author: 'testuser',
  score: 50,
  upvote_ratio: 0.9,
  num_comments: 10,
  created_utc: 1704067200,
  url: 'https://reddit.com/r/MachineLearning/comments/test123/',
  permalink: '/r/MachineLearning/comments/test123/',
  is_self: true,
  over_18: false,
  domain: 'self.MachineLearning',
  ...overrides
});

global.createMockTweet = (overrides = {}) => ({
  id: '1234567890123456789',
  text: 'Testing MCP functionality #MCP',
  created_at: '2024-01-01T12:00:00Z',
  author_id: '987654321',
  author_name: 'Test User',
  author_username: 'testuser',
  author_verified: false,
  author_followers: 100,
  retweet_count: 5,
  like_count: 20,
  reply_count: 3,
  quote_count: 1,
  language: 'en',
  context_annotations: [],
  url: 'https://twitter.com/testuser/status/1234567890123456789',
  ...overrides
});

// Mock fetch for tests that need it
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200
  })
);