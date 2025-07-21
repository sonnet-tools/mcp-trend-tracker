# MCP Trend Tracker 📈

A comprehensive tracker for Model Context Protocol (MCP) adoption trends, community growth, and ecosystem development.

## 🚀 Overview

This project monitors the explosive growth of the Model Context Protocol (MCP) ecosystem, tracking GitHub repositories, community adoption, and industry trends since Anthropic's release in November 2024.

## ✨ Features

- **Real-time GitHub tracking** - Monitor MCP-related repositories and stars
- **Community metrics** - Track contributors, forks, and engagement
- **Trend analysis** - Identify growth patterns and adoption rates
- **Visual dashboards** - Interactive charts and graphs
- **Automated reporting** - Daily/weekly trend summaries
- **API integrations** - GitHub, npm registry, and more

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/username/mcp-trend-tracker.git
cd mcp-trend-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the application
npm start
```

## 📊 Usage

### Development Mode
```bash
npm run dev
```

### Run Scrapers
```bash
npm run scrape
```

### Generate Analytics
```bash
npm run analyze
```

### View Dashboard
```bash
npm run serve
# Open http://localhost:8080
```

## 🏗️ Project Structure

```
mcp-trend-tracker/
├── src/
│   ├── scrapers/          # Data collection modules
│   ├── analytics/         # Trend analysis algorithms
│   ├── dashboard/         # Web interface
│   ├── database/          # Data storage layer
│   └── utils/            # Helper functions
├── tests/                # Test suites
├── docs/                 # Documentation
├── config/               # Configuration files
└── data/                # Collected data
```

## 🔧 Configuration

Configure the application by setting these environment variables in `.env`:

- `GITHUB_TOKEN` - GitHub API token for data collection
- `DATABASE_URL` - SQLite database path
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `SCRAPE_INTERVAL` - Data collection frequency in hours

## 📈 Data Sources

- **GitHub API** - Repository metrics and activity
- **npm Registry** - Package downloads and versions
- **HackerNews API** - Community discussions
- **Reddit API** - Subreddit activity
- **Twitter API** - Social media mentions

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## 📚 API Documentation

The tracker exposes a REST API for accessing trend data:

- `GET /api/trends` - Get current trend data
- `GET /api/repos` - List tracked repositories
- `GET /api/stats` - Get summary statistics
- `GET /api/growth` - Get growth metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for creating MCP
- The MCP community for rapid adoption and development
- All contributors to MCP servers and tools

## 📞 Support

- 📧 Email: support@mcp-trend-tracker.com
- 💬 Discord: [MCP Community](https://discord.gg/mcp)
- 🐛 Issues: [GitHub Issues](https://github.com/username/mcp-trend-tracker/issues)

---

⭐ Star this repository if you find it useful!