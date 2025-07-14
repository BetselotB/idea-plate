'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createIdea } from '@/lib/ideas';
import { IDEA_CATEGORIES, IdeaCategory } from '@/types/idea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { CollaborationStatus } from '@/types/idea';

export default function ShareIdea() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IdeaCategory | '',
    tags: '',
    collaborationStatus: 'lfp' as CollaborationStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setShowDropdown(false));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to share an idea');
      return;
    }

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

      const ideaData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as IdeaCategory,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email || '',
        tags: tagsArray,
        collaborationStatus: formData.collaborationStatus as CollaborationStatus,
      };

      const { id, error: createError } = await createIdea(ideaData);
      
      if (createError) {
        setError(createError);
      } else {
        // Redirect to dashboard after successful creation
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create idea');
    } finally {
      setSubmitting(false);
    }
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
    router.push('/auth');
    return null;
  }

  if (!user.emailVerified) {
    router.push('/verify-email');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Idea
          </h1>
          <p className="text-lg text-gray-600">
            Have a brilliant idea? Share it with the community and get feedback from other creators.
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
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="collaborationStatus"
                    value="gave-up"
                    checked={formData.collaborationStatus === 'gave-up'}
                    onChange={() => handleInputChange('collaborationStatus', 'gave-up')}
                    required
                    disabled={submitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">I’m giving this up, take it!</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="collaborationStatus"
                    value="lfp"
                    checked={formData.collaborationStatus === 'lfp'}
                    onChange={() => handleInputChange('collaborationStatus', 'lfp')}
                    required
                    disabled={submitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Looking for collaborators with skills</span>
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
                    Sharing Idea...
                  </div>
                ) : (
                  'Share Idea'
                )}
              </button>
              
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-none border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Make Your Idea Go Viral (or at Least Get Stolen)</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• The crazier, the better. Boring ideas get ignored (and not even stolen).</li>
            <li>• Add enough details so someone else can actually build it (and take all the credit).</li>
            <li>• Use spicy tags. #Unicorn #DefinitelyNotAScam #SharkTankReject</li>
            <li>• Don’t be shy—overshare! The more you write, the more meme potential.</li>
            <li>• Remember: Once it’s here, it’s basically public domain. You’ve been warned.</li>
          </ul>
        </div>
      </main>
    </div>
  );
} 