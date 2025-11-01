'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Project {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  topics: string[];
  openIssues: number;
  license: string;
  lastUpdated: string;
  owner: {
    login: string;
    avatar: string;
  };
}

interface ApiResponse {
  success: boolean;
  count: number;
  total: number;
  projects: Project[];
  error?: string;
  message?: string;
}

export default function GitHubProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/github-projects');
        const data: ApiResponse = await response.json();

        if (data.success) {
          setProjects(data.projects);
        } else {
          setError(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        setError('Failed to fetch GitHub projects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <>
      <Header />
      <main className="bg-orange-50 text-gray-900 min-h-screen">
        {/* Hero Section */}
        <section className="bg-[#db4b0d] text-white py-20 px-6 text-center shadow-lg">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Open Source Python Projects
          </h1>
          <p className="mt-4 text-sm sm:text-xl max-w-2xl mx-auto">
            Discover Python projects accepting new contributors with &quot;good first issue&quot; or &quot;help wanted&quot; labels
          </p>
        </section>

        {/* Projects Section */}
        <section className="py-12 px-6 max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#db4b0d] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <p className="text-lg text-gray-700">
                  Found <span className="font-bold text-[#db4b0d]">{projects.length}</span> projects
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Owner Info */}
                      <div className="flex items-center mb-4">
                        <Image
                          src={project.owner.avatar}
                          alt={project.owner.login}
                          width={40}
                          height={40}
                          className="rounded-full mr-3"
                        />
                        <div>
                          <p className="text-sm text-gray-600">{project.owner.login}</p>
                        </div>
                      </div>

                      {/* Project Name */}
                      <h3 className="text-xl font-bold text-[#db4b0d] mb-2">
                        {project.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {project.description || 'No description available'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {project.stars.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {project.openIssues} issues
                        </div>
                      </div>

                      {/* Topics */}
                      {project.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.topics.slice(0, 3).map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-[#db4b0d] text-xs rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* License */}
                      <p className="text-xs text-gray-500 mb-4">
                        License: {project.license}
                      </p>

                      {/* CTA Button */}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#db4b0d] text-white text-center py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
