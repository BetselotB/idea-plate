'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase';
import { getIdeas } from '@/lib/ideas';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IdeaCard from '@/components/IdeaCard';
import { UserIcon } from '@heroicons/react/24/solid';
import IdeaFilters from '@/components/IdeaFilters';
import { Idea, IdeaFilters as IdeaFiltersType } from '@/types/idea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { BellIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [filters, setFilters] = useState<IdeaFiltersType>({ sortBy: 'newest' });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setShowDropdown(false));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !user.emailVerified) {
      router.push('/verify-email');
    }
  }, [user, loading, router]);

  // Fetch ideas when filters change
  useEffect(() => {
    if (user?.emailVerified) {
      fetchIdeas();
    }
  }, [filters, user]);

  const fetchIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const { ideas: fetchedIdeas, error } = await getIdeas(filters);
      if (error) {
        console.error('Error fetching ideas:', error);
      } else {
        setIdeas(fetchedIdeas);
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (!error) {
      router.push('/auth');
    }
  };

  const handleShareIdea = () => {
    router.push('/share-idea');
  };

  const handleMyIdeas = () => {
    router.push('/my-ideas');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleLike = (ideaId: string) => {
    // TODO: Implement like functionality
    console.log('Like idea:', ideaId);
  };

  const handleComment = (ideaId: string) => {
    // TODO: Implement comment functionality
    console.log('Comment on idea:', ideaId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (!user.emailVerified) {
    return null; // Will redirect to verify-email
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters and Share Idea Button Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <IdeaFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Ideas Feed */}
        <div className="space-y-6">
          {loadingIdeas ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas found</h3>
              <p className="text-gray-600 mb-4">
                {filters.category || filters.search 
                  ? "Try adjusting your filters or search terms."
                  : "Be the first to share an idea!"
                }
              </p>
              {!filters.category && !filters.search && (
                <button
                  onClick={handleShareIdea}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Share Your First Idea</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {ideas.length} idea{ideas.length !== 1 ? 's' : ''} found
              </div>
              
              {/* Ideas List */}
              <div className="space-y-6">
                {ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 