const { TrendAnalyzer } = require('../src/analytics/trend-analyzer');

// Mock external dependencies
jest.mock('../src/database');
jest.mock('../src/utils/logger');

describe('TrendAnalyzer', () => {
  let analyzer;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database responses
    mockDb = {
      db: {
        all: jest.fn()
      },
      saveTrendMetric: jest.fn().mockResolvedValue()
    };

    analyzer = new TrendAnalyzer();
    analyzer.db = mockDb;
  });

  describe('generateSummary', () => {
    test('should calculate total activity correctly', () => {
      const report = {
        github: {
          totalRepos: { count: 100 },
          totalStars: { total: 5000 }
        },
        npm: {
          totalPackages: { count: 50 }
        },
        social: {
          redditPosts: { count: 25 }
        }
      };

      const summary = analyzer.generateSummary(report);

      expect(summary.totalActivity).toBe(175); // 100 + 50 + 25
      expect(summary.keyMetrics.repositories).toBe(100);
      expect(summary.keyMetrics.total_stars).toBe(5000);
      expect(summary.keyMetrics.npm_packages).toBe(50);
    });

    test('should handle missing data gracefully', () => {
      const report = {
        github: null,
        npm: { totalPackages: { count: 10 } },
        social: null
      };

      const summary = analyzer.generateSummary(report);

      expect(summary.totalActivity).toBe(10);
      expect(summary.keyMetrics.repositories).toBe(0);
      expect(summary.keyMetrics.npm_packages).toBe(10);
      expect(summary.keyMetrics.reddit_discussions).toBe(0);
    });

    test('should generate growth indicators', () => {
      const report = {
        github: {
          recentRepos: { count: 15 },
          totalRepos: { count: 100 }
        },
        npm: {
          recentPackages: { count: 8 },
          totalPackages: { count: 50 }
        },
        social: {}
      };

      const summary = analyzer.generateSummary(report);

      expect(summary.growthIndicators).toHaveLength(2);
      expect(summary.growthIndicators[0]).toContain('15 new repos');
      expect(summary.growthIndicators[1]).toContain('8 new NPM packages');
    });
  });

  describe('analyzeGitHubTrends', () => {
    test('should execute all GitHub queries', async () => {
      // Mock database responses
      mockDb.db.all.mockImplementation((query, callback) => {
        if (query.includes('COUNT(*)')) {
          callback(null, [{ count: 100 }]);
        } else if (query.includes('SUM(stars)')) {
          callback(null, [{ total: 5000 }]);
        } else if (query.includes('language')) {
          callback(null, [
            { language: 'JavaScript', count: 50 },
            { language: 'Python', count: 30 }
          ]);
        } else {
          callback(null, []);
        }
      });

      const result = await analyzer.analyzeGitHubTrends();

      expect(mockDb.db.all).toHaveBeenCalledTimes(7); // 7 different queries
      expect(result.totalRepos.count).toBe(100);
      expect(result.totalStars.total).toBe(5000);
      expect(result.topLanguages).toHaveLength(2);
    });

    test('should handle database errors', async () => {
      mockDb.db.all.mockImplementation((query, callback) => {
        callback(new Error('Database error'));
      });

      const result = await analyzer.analyzeGitHubTrends();

      // Should still return results with null values for failed queries
      expect(result.totalRepos).toBeNull();
      expect(result.totalStars).toBeNull();
    });
  });

  describe('saveTrendMetrics', () => {
    test('should save all key metrics', async () => {
      const report = {
        github: {
          totalRepos: { count: 100 },
          totalStars: { total: 5000 },
          totalForks: { total: 1000 }
        },
        npm: {
          totalPackages: { count: 50 }
        },
        social: {
          redditPosts: { count: 25 },
          twitterPosts: { count: 15 }
        },
        summary: {
          totalActivity: 190
        }
      };

      await analyzer.saveTrendMetrics(report);

      expect(mockDb.saveTrendMetric).toHaveBeenCalledTimes(7);
      expect(mockDb.saveTrendMetric).toHaveBeenCalledWith('github', 'total_repos', 100, expect.any(String));
      expect(mockDb.saveTrendMetric).toHaveBeenCalledWith('github', 'total_stars', 5000, expect.any(String));
      expect(mockDb.saveTrendMetric).toHaveBeenCalledWith('npm', 'total_packages', 50, expect.any(String));
    });

    test('should handle save errors gracefully', async () => {
      mockDb.saveTrendMetric.mockRejectedValue(new Error('Save failed'));

      const report = {
        github: { totalRepos: { count: 100 } },
        npm: { totalPackages: { count: 50 } },
        social: { redditPosts: { count: 25 } },
        summary: { totalActivity: 175 }
      };

      // Should not throw error
      await expect(analyzer.saveTrendMetrics(report)).resolves.toBeUndefined();
    });
  });
});