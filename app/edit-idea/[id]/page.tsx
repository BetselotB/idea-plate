'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateIdea } from '@/lib/ideas';
import { IDEA_CATEGORIES, IdeaCategory } from '@/types/idea';
import { Idea } from '@/types/idea';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function EditIdea() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loadingIdea, setLoadingIdea] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IdeaCategory | '',
    tags: '',
    collaborationStatus: '' as 'gave-up' | 'lfp' | '',
  });

  useClickOutside(dropdownRef, () => setShowDropdown(false));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !user.emailVerified) {
      router.push('/verify-email');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.emailVerified && ideaId) {
      fetchIdea();
    }
  }, [ideaId, user]);

  const fetchIdea = async () => {
    setLoadingIdea(true);
    try {
      const ideaDoc = await getDoc(doc(db, "ideas", ideaId));
      
      if (ideaDoc.exists()) {
        const data = ideaDoc.data();
        const fetchedIdea: Idea = {
          id: ideaDoc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          tags: data.tags || [],
        };

        // Check if user owns this idea
        if (fetchedIdea.authorId !== user?.uid) {
          setError('You can only edit your own ideas');
          return;
        }

        setIdea(fetchedIdea);
        setFormData({
          title: fetchedIdea.title,
          description: fetchedIdea.description,
          category: fetchedIdea.category,
          tags: fetchedIdea.tags.join(', '),
          collaborationStatus: fetchedIdea.collaborationStatus || 'lfp',
        });
      } else {
        setError('Idea not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load idea');
    } finally {
      setLoadingIdea(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idea) return;

    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.collaborationStatus) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as IdeaCategory,
        tags: tagsArray,
      };
      if (formData.collaborationStatus === 'lfp' || formData.collaborationStatus === 'gave-up') {
        updateData.collaborationStatus = formData.collaborationStatus;
      }

      const { error: updateError } = await updateIdea(idea.id, updateData);
      
      if (updateError) {
        setError(updateError);
      } else {
        // Redirect to my ideas page after successful update
        router.push('/my-ideas');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update idea');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingIdea) {
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

  if (error && !idea) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Idea</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/my-ideas"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Back to My Ideas</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Your Idea
          </h1>
          <p className="text-lg text-gray-600">
            Update your idea to make it even better.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Idea Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter a catchy title for your idea"
                required
                disabled={submitting}
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
                disabled={submitting}
              >
                <option value="">Select a category</option>
                {IDEA_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                placeholder="Describe your idea in detail. What problem does it solve? How would it work? What makes it unique?"
                required
                disabled={submitting}
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter tags separated by commas (e.g., AI, mobile, sustainability)"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Tags help others discover your idea. Separate multiple tags with commas.
              </p>
            </div>

            {/* Collaboration Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collaboration Status *
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="collaborationStatus"
                    value="gave-up"
                    checked={formData.collaborationStatus === 'gave-up'}
                    onChange={() => handleInputChange('collaborationStatus', 'gave-up')}
                    required
                    disabled={submitting}
                  />
                  <span>I’m giving this up, take it!</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="collaborationStatus"
                    value="lfp"
                    checked={formData.collaborationStatus === 'lfp'}
                    onChange={() => handleInputChange('collaborationStatus', 'lfp')}
                    required
                    disabled={submitting}
                  />
                  <span>Looking for collaborators with skills</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating Idea...
                  </div>
                ) : (
                  'Update Idea'
                )}
              </button>
              
              <Link
                href="/my-ideas"
                className="flex-1 sm:flex-none border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 