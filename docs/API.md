# API Documentation

The MCP Trend Tracker provides a RESTful API for accessing collected data and analytics.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Health Check

#### GET `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Trends

#### GET `/trends`

Get the latest trend analysis report.

**Response:**
```json
{
  "date": "2024-01-01",
  "github": {
    "totalRepos": { "count": 1250 },
    "totalStars": { "total": 45000 },
    "totalForks": { "total": 8500 },
    "topLanguages": [
      { "language": "JavaScript", "count": 450 },
      { "language": "Python", "count": 380 }
    ]
  },
  "npm": {
    "totalPackages": { "count": 180 },
    "avgScore": { "avg_score": 0.72 }
  },
  "social": {
    "redditPosts": { "count": 89 },
    "twitterPosts": { "count": 234 }
  },
  "summary": {
    "totalActivity": 1719,
    "keyMetrics": {
      "repositories": 1250,
      "total_stars": 45000,
      "npm_packages": 180
    }
  }
}
```

---

### Repositories

#### GET `/repos`

Get GitHub repositories related to MCP.

**Query Parameters:**
- `limit` (integer, default: 50) - Number of results to return
- `offset` (integer, default: 0) - Number of results to skip
- `sort` (string, default: 'stars') - Sort field (stars, forks, created_at, updated_at)
- `order` (string, default: 'DESC') - Sort order (ASC, DESC)

**Example Request:**
```
GET /api/repos?limit=10&sort=stars&order=DESC
```

**Response:**
```json
[
  {
    "id": 123456,
    "name": "mcp-server-example",
    "full_name": "anthropics/mcp-server-example",
    "owner": "anthropics",
    "description": "Example MCP server implementation",
    "stars": 1250,
    "forks": 89,
    "language": "TypeScript",
    "created_at": "2024-11-20T10:30:00Z",
    "updated_at": "2024-01-01T15:45:00Z",
    "topics": "[\"mcp\", \"ai\", \"anthropic\"]",
    "url": "https://github.com/anthropics/mcp-server-example"
  }
]
```

---

### NPM Packages

#### GET `/packages`

Get NPM packages related to MCP.

**Query Parameters:**
- `limit` (integer, default: 50) - Number of results to return
- `offset` (integer, default: 0) - Number of results to skip

**Response:**
```json
[
  {
    "name": "@anthropic/mcp-server",
    "version": "1.2.0",
    "description": "Official MCP server toolkit",
    "keywords": "[\"mcp\", \"ai\", \"server\"]",
    "author": "Anthropic",
    "maintainers": 3,
    "npm_url": "https://www.npmjs.com/package/@anthropic/mcp-server",
    "score_final": 0.95,
    "score_quality": 0.92,
    "score_popularity": 0.88,
    "score_maintenance": 1.0
  }
]
```

---

### Social Media

#### GET `/social`

Get social media posts about MCP.

**Query Parameters:**
- `platform` (string, required) - Platform to query ('reddit' or 'twitter')
- `limit` (integer, default: 50) - Number of results to return

**Example Request:**
```
GET /api/social?platform=reddit&limit=20
```

**Response (Reddit):**
```json
[
  {
    "id": "abc123",
    "title": "MCP is revolutionizing AI tool integration",
    "selftext": "Just implemented my first MCP server...",
    "subreddit": "MachineLearning",
    "author": "aidev2024",
    "score": 156,
    "upvote_ratio": 0.94,
    "num_comments": 23,
    "created_utc": 1704067200,
    "permalink": "https://reddit.com/r/MachineLearning/comments/abc123/"
  }
]
```

**Response (Twitter):**
```json
[
  {
    "id": "1234567890123456789",
    "text": "Excited to see MCP adoption growing so quickly! #MCP #AI",
    "created_at": "2024-01-01T12:00:00Z",
    "author_name": "AI Researcher",
    "author_username": "airesearcher",
    "like_count": 45,
    "retweet_count": 12,
    "reply_count": 3
  }
]
```

---

### Statistics

#### GET `/stats`

Get summary statistics across all data sources.

**Response:**
```json
{
  "repos": {
    "count": 1250,
    "total_stars": 45000,
    "total_forks": 8500
  },
  "packages": {
    "count": 180,
    "avg_score": 0.72
  },
  "reddit": {
    "count": 89,
    "avg_score": 67.5
  },
  "twitter": {
    "count": 234,
    "avg_likes": 23.8
  }
}
```

---

### Growth Metrics

#### GET `/growth`

Get historical growth data for trend analysis.

**Query Parameters:**
- `days` (integer, default: 30) - Number of days of historical data

**Response:**
```json
{
  "github.total_repos": [
    { "date": "2024-01-01", "value": 1250 },
    { "date": "2023-12-31", "value": 1240 },
    { "date": "2023-12-30", "value": 1235 }
  ],
  "npm.total_packages": [
    { "date": "2024-01-01", "value": 180 },
    { "date": "2023-12-31", "value": 178 }
  ]
}
```

---

### Search

#### GET `/search`

Search across all data sources.

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string, default: 'all') - Data type to search ('all', 'repos', 'packages', 'social')

**Example Request:**
```
GET /api/search?q=anthropic&type=repos
```

**Response:**
```json
{
  "repositories": [
    {
      "name": "mcp-server-anthropic",
      "full_name": "anthropics/mcp-server-anthropic",
      "description": "Anthropic's official MCP server",
      "stars": 2000
    }
  ],
  "packages": [],
  "social": []
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error description"
}
```

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15-minute window per IP
- Exceeding limits returns HTTP 429 (Too Many Requests)