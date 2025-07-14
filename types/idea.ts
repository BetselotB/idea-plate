export interface CollaborationRequest {
  id: string;
  ideaId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterGithub?: string;
  requesterLinkedin?: string;
  createdAt: Date;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  tags: string[];
  collaborationStatus?: CollaborationStatus;
  collaborators?: Array<{
    userId: string;
    name: string;
    email: string;
    github?: string;
    linkedin?: string;
  }>;
}

export type IdeaCategory = 
  | 'app-idea'
  | 'business-idea'
  | 'website-idea'
  | 'product-idea'
  | 'service-idea'
  | 'tech-idea'
  | 'social-idea'
  | 'education-idea'
  | 'health-idea'
  | 'finance-idea'
  | 'entertainment-idea'
  | 'other';

export const IDEA_CATEGORIES: { value: IdeaCategory; label: string; icon: string }[] = [
  { value: 'app-idea', label: 'App Idea', icon: '📱' },
  { value: 'business-idea', label: 'Business Idea', icon: '💼' },
  { value: 'website-idea', label: 'Website Idea', icon: '🌐' },
  { value: 'product-idea', label: 'Product Idea', icon: '📦' },
  { value: 'service-idea', label: 'Service Idea', icon: '🔧' },
  { value: 'tech-idea', label: 'Tech Idea', icon: '⚡' },
  { value: 'social-idea', label: 'Social Idea', icon: '👥' },
  { value: 'education-idea', label: 'Education Idea', icon: '📚' },
  { value: 'health-idea', label: 'Health Idea', icon: '🏥' },
  { value: 'finance-idea', label: 'Finance Idea', icon: '💰' },
  { value: 'entertainment-idea', label: 'Entertainment Idea', icon: '🎬' },
  { value: 'other', label: 'Other', icon: '💡' },
];

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'most-liked';

export interface IdeaFilters {
  category?: IdeaCategory;
  search?: string;
  sortBy: SortOption;
} 

export type CollaborationStatus = 'gave-up' | 'lfp'; 