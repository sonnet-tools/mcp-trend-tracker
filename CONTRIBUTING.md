# Contributing to MCP Trend Tracker

Thank you for your interest in contributing to MCP Trend Tracker! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see [Development Setup](#development-setup))
4. **Create a branch** for your feature or bug fix
5. **Make your changes** following our coding standards
6. **Test your changes** thoroughly
7. **Submit a pull request**

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Log outputs** if relevant

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear description** of the enhancement
- **Use case** explaining why this would be useful
- **Possible implementation** ideas (if you have them)

### Contributing Code

We welcome code contributions! Areas where help is especially appreciated:

- **New data sources** (APIs, websites)
- **Analytics improvements** (better trend analysis)
- **Dashboard features** (visualization, UI)
- **Performance optimizations**
- **Documentation improvements**
- **Bug fixes**

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/yourusername/mcp-trend-tracker.git
cd mcp-trend-tracker

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your API keys (GitHub token recommended for development)

# Run tests to ensure everything works
npm test

# Start development server
npm run dev
```

### Project Structure

```
mcp-trend-tracker/
├── src/
│   ├── analytics/        # Trend analysis logic
│   ├── database/         # Database models and migrations
│   ├── routes/          # API route handlers
│   ├── scrapers/        # Data collection modules
│   └── utils/           # Utility functions
├── tests/               # Test suites
├── docs/                # Documentation
└── config/              # Configuration files
```

## Coding Standards

### JavaScript Style

We use ESLint for code formatting. Run `npm run lint` to check your code.

**Key conventions:**

- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Use **UPPER_SNAKE_CASE** for constants
- Use **2 spaces** for indentation
- Use **semicolons**
- Prefer **const** over **let**, avoid **var**
- Use **async/await** over promises when possible

### Example Code Style

```javascript
// Good
const MAX_RETRY_ATTEMPTS = 3;

class GitHubScraper {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.retryCount = 0;
  }

  async fetchRepositories() {
    try {
      const response = await this.makeRequest('/search/repositories');
      return this.processResponse(response);
    } catch (error) {
      logger.error('Failed to fetch repositories:', error);
      throw error;
    }
  }
}
```

### Documentation

- **JSDoc comments** for public methods
- **Inline comments** for complex logic
- **README updates** for new features

```javascript
/**
 * Scrapes GitHub repositories related to MCP
 * @param {Object} options - Scraping options
 * @param {number} options.limit - Maximum repositories to fetch
 * @returns {Promise<Array>} Array of repository objects
 */
async scrapeRepositories(options = {}) {
  // Implementation
}
```

## Testing Guidelines

### Writing Tests

- **Unit tests** for individual functions/classes
- **Integration tests** for API endpoints
- **Mock external dependencies** (APIs, databases)

### Test Structure

```javascript
describe('GitHubScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new GitHubScraper({ apiKey: 'test-key' });
  });

  describe('scrapeRepositories', () => {
    test('should return array of repositories', async () => {
      // Mock API response
      const mockResponse = { data: { items: [/* ... */] } };
      axios.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await scraper.scrapeRepositories();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(mockResponse.data.items.length);
    });

    test('should handle API errors gracefully', async () => {
      axios.get = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(scraper.scrapeRepositories()).rejects.toThrow('API Error');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- scrapers.test.js
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(scrapers): add Reddit API integration

- Implement RedditScraper class
- Add subreddit monitoring
- Include sentiment analysis

Closes #123
```

```
fix(database): handle SQLite connection errors

- Add connection retry logic
- Improve error messages
- Update error handling tests
```

## Pull Request Process

### Before Submitting

1. **Run tests**: `npm test`
2. **Run linting**: `npm run lint`
3. **Update documentation** if needed
4. **Add/update tests** for your changes
5. **Test manually** in development environment

### PR Requirements

- **Clear title** and description
- **Link to related issues**
- **Screenshots** for UI changes
- **Test results** if relevant
- **Breaking changes** clearly documented

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step one
2. Step two
3. Expected result

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Address feedback** if requested
4. **Merge** after approval

### After Merge

- **Delete feature branch** (both local and remote)
- **Update your fork** with the latest changes
- **Check deployment** if applicable

## Development Tips

### Local Development

```bash
# Watch mode for development
npm run dev

# Test specific scraper
npm run scrape

# Generate analytics report
npm run analyze

# Check API endpoints
curl http://localhost:3000/api/health
```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# View logs
tail -f logs/combined.log
```

### Database Management

```bash
# View SQLite database
sqlite3 data/mcp-trends.db
.tables
SELECT * FROM repositories LIMIT 5;
```

## Getting Help

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Search existing issues or create new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server

## Recognition

Contributors are recognized in:

- **Contributors** section of README
- **Release notes** for significant contributions
- **Hall of Fame** for major contributions

Thank you for contributing to MCP Trend Tracker! 🚀