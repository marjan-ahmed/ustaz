# GitHub Projects Feature

## Overview
This feature allows users to discover open-source Python projects on GitHub that are accepting new contributors.

## Access the Feature
Navigate to `/github-projects` in your browser to view the list of Python projects.

Example: `http://localhost:3000/github-projects`

## What it does
The feature:
1. Searches GitHub for Python repositories
2. Filters for projects with over 100 stars
3. Only shows projects with "good-first-issue" or "help-wanted" labels
4. Displays them in an easy-to-browse interface

## API Endpoint
The backend API is available at:
```
GET /api/github-projects
```

### Response Format
```json
{
  "success": true,
  "count": 30,
  "total": 1234,
  "projects": [
    {
      "id": 12345,
      "name": "project-name",
      "fullName": "owner/project-name",
      "description": "Project description",
      "url": "https://github.com/owner/project-name",
      "stars": 1500,
      "language": "Python",
      "topics": ["topic1", "topic2"],
      "openIssues": 42,
      "license": "MIT License",
      "lastUpdated": "2024-01-01T00:00:00Z",
      "owner": {
        "login": "owner",
        "avatar": "https://avatars.githubusercontent.com/..."
      }
    }
  ]
}
```

## Features
- **Loading State**: Shows spinner while fetching data
- **Error Handling**: Displays user-friendly error messages
- **Responsive Design**: Works on mobile and desktop
- **Project Cards**: Each project displays:
  - Owner information with avatar
  - Project name and description
  - Star count and open issues
  - Topics/tags
  - License information
  - Direct link to GitHub repository

## Technical Details
- **Frontend**: React component using Next.js App Router
- **Backend**: Next.js API route
- **Caching**: Results are cached and revalidated every hour
- **Styling**: Tailwind CSS matching the existing design system

## Rate Limits
The GitHub API has rate limits:
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour

To use authenticated requests and avoid rate limits, set the `GITHUB_TOKEN` environment variable:

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token
```

To create a GitHub personal access token:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token (classic)
3. No special permissions are needed for public repository searches
4. Copy the token and add it to your `.env.local` file
