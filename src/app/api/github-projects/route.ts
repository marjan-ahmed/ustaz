import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // GitHub API search endpoint
    // Search for Python repos with >100 stars and good first issue or help wanted labels
    const query = 'language:Python stars:>100 (label:"good-first-issue" OR label:"help-wanted")';
    const searchParams = new URLSearchParams({
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: '30'
    });

    const response = await fetch(
      `https://api.github.com/search/repositories?${searchParams}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ustaz-app',
          // Add GitHub token if available for higher rate limits
          ...(process.env.GITHUB_TOKEN && { 
            'Authorization': `token ${process.env.GITHUB_TOKEN}` 
          })
        },
        next: { revalidate: 3600 } // Revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter and format the results
    const projects = data.items.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics || [],
      openIssues: repo.open_issues_count,
      license: repo.license?.name || 'No license',
      lastUpdated: repo.updated_at,
      owner: {
        login: repo.owner.login,
        avatar: repo.owner.avatar_url
      }
    }));

    return NextResponse.json({
      success: true,
      count: projects.length,
      total: data.total_count,
      projects
    });

  } catch (error) {
    console.error('Error fetching GitHub projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch GitHub projects',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
