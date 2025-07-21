const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'mcp-trends.db');
    this.ensureDataDir();
    this.db = new sqlite3.Database(this.dbPath);
  }

  ensureDataDir() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // GitHub repositories table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS repositories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            full_name TEXT UNIQUE NOT NULL,
            owner TEXT NOT NULL,
            description TEXT,
            stars INTEGER DEFAULT 0,
            forks INTEGER DEFAULT 0,
            language TEXT,
            created_at TEXT,
            updated_at TEXT,
            topics TEXT,
            url TEXT,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Repository details table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS repo_details (
            repo_id INTEGER PRIMARY KEY,
            contributors INTEGER DEFAULT 0,
            languages TEXT,
            recent_commits INTEGER DEFAULT 0,
            last_commit_date TEXT,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (repo_id) REFERENCES repositories (id)
          )
        `);

        // NPM packages table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS npm_packages (
            name TEXT PRIMARY KEY,
            version TEXT,
            description TEXT,
            keywords TEXT,
            author TEXT,
            maintainers INTEGER DEFAULT 0,
            created TEXT,
            modified TEXT,
            npm_url TEXT,
            homepage TEXT,
            repository TEXT,
            score_final REAL,
            score_quality REAL,
            score_popularity REAL,
            score_maintenance REAL,
            downloads INTEGER DEFAULT 0,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Reddit posts table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS reddit_posts (
            id TEXT PRIMARY KEY,
            title TEXT,
            selftext TEXT,
            subreddit TEXT,
            author TEXT,
            score INTEGER DEFAULT 0,
            upvote_ratio REAL,
            num_comments INTEGER DEFAULT 0,
            created_utc INTEGER,
            url TEXT,
            permalink TEXT,
            is_self BOOLEAN,
            over_18 BOOLEAN,
            domain TEXT,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Twitter posts table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS twitter_posts (
            id TEXT PRIMARY KEY,
            text TEXT,
            created_at TEXT,
            author_id TEXT,
            author_name TEXT,
            author_username TEXT,
            author_verified BOOLEAN,
            author_followers INTEGER DEFAULT 0,
            retweet_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            reply_count INTEGER DEFAULT 0,
            quote_count INTEGER DEFAULT 0,
            language TEXT,
            context_annotations TEXT,
            url TEXT,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Trend metrics table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS trend_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_type TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value INTEGER NOT NULL,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async saveRepositories(repos) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO repositories 
        (id, name, full_name, owner, description, stars, forks, language, created_at, updated_at, topics, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      repos.forEach(repo => {
        stmt.run([
          repo.id,
          repo.name,
          repo.full_name,
          repo.owner,
          repo.description,
          repo.stars,
          repo.forks,
          repo.language,
          repo.created_at,
          repo.updated_at,
          JSON.stringify(repo.topics),
          repo.url
        ]);
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveRepoDetails(repoId, details) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO repo_details 
        (repo_id, contributors, languages, recent_commits, last_commit_date)
        VALUES (?, ?, ?, ?, ?)
      `, [
        repoId,
        details.contributors,
        JSON.stringify(details.languages),
        details.recent_commits,
        details.last_commit_date
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveNPMPackages(packages) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO npm_packages 
        (name, version, description, keywords, author, maintainers, created, modified, 
         npm_url, homepage, repository, score_final, score_quality, score_popularity, score_maintenance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      packages.forEach(pkg => {
        stmt.run([
          pkg.name,
          pkg.version,
          pkg.description,
          JSON.stringify(pkg.keywords),
          pkg.author,
          pkg.maintainers,
          pkg.created,
          pkg.modified,
          pkg.npm_url,
          pkg.homepage,
          pkg.repository,
          pkg.score?.final,
          pkg.score?.detail?.quality,
          pkg.score?.detail?.popularity,
          pkg.score?.detail?.maintenance
        ]);
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveRedditPosts(posts) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO reddit_posts 
        (id, title, selftext, subreddit, author, score, upvote_ratio, num_comments,
         created_utc, url, permalink, is_self, over_18, domain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      posts.forEach(post => {
        stmt.run([
          post.id,
          post.title,
          post.selftext,
          post.subreddit,
          post.author,
          post.score,
          post.upvote_ratio,
          post.num_comments,
          post.created_utc,
          post.url,
          post.permalink,
          post.is_self,
          post.over_18,
          post.domain
        ]);
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveTwitterPosts(tweets) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO twitter_posts 
        (id, text, created_at, author_id, author_name, author_username, author_verified,
         author_followers, retweet_count, like_count, reply_count, quote_count, language,
         context_annotations, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      tweets.forEach(tweet => {
        stmt.run([
          tweet.id,
          tweet.text,
          tweet.created_at,
          tweet.author_id,
          tweet.author_name,
          tweet.author_username,
          tweet.author_verified,
          tweet.author_followers,
          tweet.retweet_count,
          tweet.like_count,
          tweet.reply_count,
          tweet.quote_count,
          tweet.language,
          JSON.stringify(tweet.context_annotations),
          tweet.url
        ]);
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveTrendMetric(type, name, value, date) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO trend_metrics (metric_type, metric_name, value, date)
        VALUES (?, ?, ?, ?)
      `, [type, name, value, date], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

module.exports = { Database };