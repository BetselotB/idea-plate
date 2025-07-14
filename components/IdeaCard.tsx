'use client';

import { useRouter } from 'next/navigation';
import { Idea, IDEA_CATEGORIES } from '@/types/idea';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { hasLikedIdea, likeIdea, unlikeIdea, getLikesCount } from '@/lib/ideas';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface IdeaCardProps {
  idea: Idea;
  onLike?: (ideaId: string) => void;
  onComment?: (ideaId: string) => void;
}

export default function IdeaCard({ idea, onLike, onComment }: IdeaCardProps) {
  const router = useRouter();
  const category = IDEA_CATEGORIES.find(cat => cat.value === idea.category);
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(idea.likes || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(idea.comments || 0);

  useEffect(() => {
    let mounted = true;
    if (user) {
      hasLikedIdea(idea.id, user.uid).then(setLiked);
    }
    // Real-time likes
    const likesCol = collection(db, `ideas/${idea.id}/likes`);
    const unsubLikes = onSnapshot(likesCol, (snap) => {
      if (mounted) setLikeCount(snap.size);
    });
    // Real-time comments
    const commentsCol = collection(db, `ideas/${idea.id}/comments`);
    const unsubComments = onSnapshot(commentsCol, (snap) => {
      if (mounted) setCommentCount(snap.size);
    });
    return () => { mounted = false; unsubLikes(); unsubComments(); };
  }, [idea.id, user]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Add a helper to format relative time
  function formatRelative(date: Date) {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds
    if (diff < 10) return 'just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return date.toLocaleDateString();
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/idea/${idea.id}`);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likeLoading) return;
    setLikeLoading(true);
    if (liked) {
      setLiked(false); setLikeCount(c => c - 1);
      await unlikeIdea(idea.id, user.uid);
    } else {
      setLiked(true); setLikeCount(c => c + 1);
      await likeIdea(idea.id, user.uid);
    }
    setLikeLoading(false);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(idea.id);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {idea.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                <Link href={`/profile/${idea.authorId}`} className="hover:underline text-blue-600">
                  {idea.authorName}
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                {formatRelative(idea.createdAt)}
                {idea.updatedAt.getTime() !== idea.createdAt.getTime() && (
                  <span> · Updated {formatRelative(idea.updatedAt)}</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Category Badge and Collaboration Status */}
          <div className="flex items-center space-x-2">
            {category && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-sm">{category.icon}</span>
                <span className="text-xs font-medium text-gray-700">{category.label}</span>
              </div>
            )}
            {idea.collaborationStatus && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${idea.collaborationStatus === 'lfp' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {idea.collaborationStatus === 'lfp' ? 'Looking for collaborators' : 'Giving up (take it!)'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            {idea.title}
          </h3>
          <p className="text-gray-600 leading-relaxed line-clamp-3">
            {idea.description}
          </p>
        </div>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {idea.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                +{idea.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLikeClick}
              disabled={!user || likeLoading}
              className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
            >
              {likeLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
              ) : liked ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              )}
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            <button
              onClick={handleCommentClick}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{commentCount}</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            Click to read more
          </div>
        </div>
      </div>
    </div>
  );
} 