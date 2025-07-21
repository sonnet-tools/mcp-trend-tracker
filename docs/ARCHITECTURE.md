# Architecture Overview

This document describes the high-level architecture of the MCP Trend Tracker application.

## System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │     Scrapers    │    │    Database     │
│                 │    │                 │    │                 │
│ • GitHub API    │───▶│ • GitHub        │───▶│    SQLite       │
│ • NPM Registry  │    │ • NPM           │    │                 │
│ • Reddit API    │    │ • Reddit        │    │ • Repositories  │
│ • Twitter API   │    │ • Twitter       │    │ • Packages      │
└─────────────────┘    └─────────────────┘    │ • Social Posts  │
                                              │ • Metrics       │
                                              └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │    Analytics    │
                                              │                 │
                                              │ • Trend Analyzer│
                                              │ • Growth Calc   │
                                              │ • Aggregations  │
                                              └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Web Server    │    │      API        │
                       │                 │    │                 │
                       │ • Express.js    │◀───│ • REST API      │
                       │ • Static Files  │    │ • JSON Response │
                       │ • Dashboard     │    │ • Rate Limiting │
                       └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Data Collection Layer

#### Scrapers (`src/scrapers/`)
- **GitHub Scraper**: Collects repository data, stars, forks, contributors
- **NPM Scraper**: Tracks package downloads, scores, maintainers
- **Reddit Scraper**: Monitors discussions and sentiment
- **Twitter Scraper**: Captures social media mentions and engagement
- **Scraper Manager**: Orchestrates all scrapers, handles failures

**Key Features:**
- Rate limiting and retry logic
- Error handling and logging
- Parallel execution
- Deduplication

### 2. Data Storage Layer

#### Database (`src/database/`)
- **SQLite Database**: Stores all collected data
- **Schema Management**: Handles table creation and migrations
- **Data Models**: Repositories, NPM packages, social posts, metrics

**Tables:**
- `repositories` - GitHub repository data
- `repo_details` - Extended repository information
- `npm_packages` - NPM package information
- `reddit_posts` - Reddit discussion data
- `twitter_posts` - Twitter mention data
- `trend_metrics` - Historical trend data

### 3. Analytics Layer

#### Trend Analyzer (`src/analytics/`)
- **Growth Calculation**: Tracks growth rates over time
- **Aggregations**: Summarizes data across sources
- **Report Generation**: Creates comprehensive trend reports
- **Metrics Storage**: Persists calculated metrics

**Analytics Features:**
- Daily/weekly/monthly trend analysis
- Cross-platform correlation
- Growth rate calculations
- Anomaly detection

### 4. API Layer

#### Web Server (`src/routes/`)
- **REST API**: Provides access to all collected data
- **Rate Limiting**: Prevents API abuse
- **Query Optimization**: Efficient database queries
- **Response Caching**: Improves performance

**API Endpoints:**
- `/api/trends` - Trend analysis data
- `/api/repos` - GitHub repository data
- `/api/packages` - NPM package data
- `/api/social` - Social media data
- `/api/stats` - Summary statistics
- `/api/search` - Cross-platform search

### 5. Utility Layer

#### Utils (`src/utils/`)
- **Logger**: Centralized logging with Winston
- **Configuration**: Environment variable management
- **Helpers**: Common utility functions

## Data Flow

### 1. Collection Phase
```
External APIs → Scrapers → Data Validation → Database Storage
```

1. **Scheduled Execution**: Cron jobs trigger scrapers every 6 hours
2. **Rate Limited Requests**: Each scraper respects API rate limits
3. **Data Processing**: Raw API responses are normalized and validated
4. **Deduplication**: Duplicate records are filtered out
5. **Database Insert**: Clean data is inserted into SQLite database

### 2. Analysis Phase
```
Database → Trend Analyzer → Calculated Metrics → Metric Storage
```

1. **Data Retrieval**: Analytics engine queries stored data
2. **Calculations**: Growth rates, averages, and trends are calculated
3. **Report Generation**: Comprehensive reports are created
4. **Metric Storage**: Calculated values are stored for historical tracking

### 3. API Phase
```
Database → API Routes → Response Formatting → Client Response
```

1. **Request Processing**: API receives and validates requests
2. **Database Queries**: Optimized queries retrieve requested data
3. **Response Formatting**: Data is formatted as JSON responses
4. **Caching**: Responses are cached to improve performance

## Scalability Considerations

### Current Architecture (Single Instance)
- **Database**: SQLite for simplicity
- **Concurrency**: Node.js event loop handles concurrent requests
- **Storage**: Local file system

### Scaling Options

#### Horizontal Scaling
```
Load Balancer → Multiple App Instances → Shared Database
```

#### Database Scaling
- **SQLite → PostgreSQL**: For better concurrent access
- **Read Replicas**: Separate read/write operations
- **Sharding**: Partition data by source or date

#### Caching Layer
```
API → Redis Cache → Database
```

#### Message Queue
```
Scheduler → Queue → Workers → Database
```

## Security Considerations

### API Security
- Rate limiting per IP address
- Input validation and sanitization
- CORS configuration
- API key authentication (future)

### Data Privacy
- No personal data collection
- Public API data only
- Configurable data retention

### Infrastructure Security
- Environment variable management
- Log sanitization
- Error handling without data exposure

## Monitoring and Observability

### Logging
- **Levels**: Error, Warning, Info, Debug
- **Destinations**: File, Console
- **Rotation**: Automatic log file rotation
- **Structured**: JSON format for parsing

### Metrics
- **Application Metrics**: Request rates, response times
- **Business Metrics**: Data collection rates, trend changes
- **System Metrics**: Memory usage, CPU utilization

### Health Checks
- **API Health**: `/api/health` endpoint
- **Database Health**: Connection status
- **Scraper Health**: Last successful run times

## Configuration Management

### Environment Variables
- API keys and secrets
- Database configuration
- Feature flags
- Rate limiting settings

### Runtime Configuration
- Scraper schedules
- Analytics parameters
- API response formats

## Error Handling Strategy

### Graceful Degradation
- Continue operation if one scraper fails
- Partial data responses when possible
- Fallback to cached data

### Retry Logic
- Exponential backoff for API failures
- Circuit breaker pattern
- Maximum retry limits

### Error Reporting
- Structured error logging
- Alert notifications
- Error rate monitoring