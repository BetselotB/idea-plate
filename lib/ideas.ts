import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  limit, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  increment,
  collection as fsCollection,
  doc as fsDoc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Idea, IdeaCategory, SortOption, IdeaFilters, CollaborationStatus, CollaborationRequest } from "@/types/idea";

// Helper to robustly parse Firestore timestamps
function parseDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'string') return new Date(val);
  if (val && typeof val.toDate === 'function') return val.toDate();
  return new Date();
}

// Create a new idea
export const createIdea = async (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'collaborationStatus'>) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { id: null, error: 'No authenticated user found' };
    }
    if (!currentUser.emailVerified) {
      return { id: null, error: 'Email must be verified to create ideas' };
    }
    if (ideaData.authorId !== currentUser.uid) {
      return { id: null, error: 'Author ID mismatch' };
    }

    // Defensive: Validate all required fields
    if (
      !ideaData.title ||
      !ideaData.description ||
      !ideaData.category ||
      !ideaData.authorName ||
      !ideaData.authorEmail ||
      !Array.isArray(ideaData.tags)
    ) {
      console.error('Invalid ideaData:', ideaData);
      return { id: null, error: 'Missing or invalid fields in idea data' };
    }

    // Defensive: Force token refresh
    await currentUser.getIdToken(true);

    const docRef = await addDoc(collection(db, "ideas"), {
      ...ideaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      comments: 0,
    });

    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('Error creating idea:', error);
    return { id: null, error: error.message };
  }
};

// Fetch ideas with filtering and sorting
export const getIdeas = async (filters: IdeaFilters = { sortBy: 'newest' }) => {
  try {
    let q = collection(db, "ideas");
    const constraints: any[] = [];

    // Add category filter
    if (filters.category) {
      constraints.push(where("category", "==", filters.category));
    }

    // Add sorting
    switch (filters.sortBy) {
      case 'newest':
        constraints.push(orderBy("createdAt", "desc"));
        break;
      case 'oldest':
        constraints.push(orderBy("createdAt", "asc"));
        break;
      case 'alphabetical':
        constraints.push(orderBy("title", "asc"));
        break;
      case 'most-liked':
        constraints.push(orderBy("likes", "desc"));
        break;
    }

    // Add limit for performance
    constraints.push(limit(50));

    const q2 = query(q, ...constraints);
    const querySnapshot = await getDocs(q2);
    
    const ideas: Idea[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
        likes: data.likes || 0,
        comments: data.comments || 0,
        tags: data.tags || [],
      });
    });

    // Apply search filter in memory (for better performance with small datasets)
    let filteredIdeas = ideas;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredIdeas = ideas.filter(idea => 
        idea.title.toLowerCase().includes(searchLower) ||
        idea.description.toLowerCase().includes(searchLower) ||
        idea.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return { ideas: filteredIdeas, error: null };
  } catch (error: any) {
    return { ideas: [], error: error.message };
  }
};

// Update an idea
export const updateIdea = async (ideaId: string, updateData: Partial<Omit<Idea, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorEmail'>>) => {
  try {
    const ideaRef = doc(db, "ideas", ideaId);
    await updateDoc(ideaRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Delete an idea
export const deleteIdea = async (ideaId: string) => {
  try {
    const ideaRef = doc(db, "ideas", ideaId);
    await deleteDoc(ideaRef);
    
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Get ideas by category
export const getIdeasByCategory = async (category: IdeaCategory) => {
  return getIdeas({ category, sortBy: 'newest' });
};

// Get recent ideas
export const getRecentIdeas = async (limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, "ideas"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const ideas: Idea[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
        likes: data.likes || 0,
        comments: data.comments || 0,
        tags: data.tags || [],
      });
    });

    return { ideas, error: null };
  } catch (error: any) {
    return { ideas: [], error: error.message };
  }
};

// Get user's own ideas
export const getUserIdeas = async (userId: string, filters: IdeaFilters = { sortBy: 'newest' }) => {
  try {
    console.log('getUserIdeas called with userId:', userId);
    let q = collection(db, "ideas");
    const constraints: any[] = [
      where("authorId", "==", userId)
    ];

    // Add sorting
    switch (filters.sortBy) {
      case 'newest':
        constraints.push(orderBy("createdAt", "desc"));
        break;
      case 'oldest':
        constraints.push(orderBy("createdAt", "asc"));
        break;
      case 'alphabetical':
        constraints.push(orderBy("title", "asc"));
        break;
      case 'most-liked':
        constraints.push(orderBy("likes", "desc"));
        break;
    }

    // Add limit for performance
    constraints.push(limit(50));

    const q2 = query(q, ...constraints);
    const querySnapshot = await getDocs(q2);
    
    const ideas: Idea[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        createdAt: parseDate(data.createdAt),
        updatedAt: parseDate(data.updatedAt),
        likes: data.likes || 0,
        comments: data.comments || 0,
        tags: data.tags || [],
      });
    });

    // Apply search filter in memory
    let filteredIdeas = ideas;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredIdeas = ideas.filter(idea => 
        idea.title.toLowerCase().includes(searchLower) ||
        idea.description.toLowerCase().includes(searchLower) ||
        idea.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return { ideas: filteredIdeas, error: null };
  } catch (error: any) {
    return { ideas: [], error: error.message };
  }
}; 

// Likes logic
export const likeIdea = async (ideaId: string, userId: string) => {
  const likeRef = fsDoc(db, `ideas/${ideaId}/likes/${userId}`);
  await setDoc(likeRef, { likedAt: serverTimestamp() });
};

export const unlikeIdea = async (ideaId: string, userId: string) => {
  const likeRef = fsDoc(db, `ideas/${ideaId}/likes/${userId}`);
  await deleteDoc(likeRef);
};

export const hasLikedIdea = async (ideaId: string, userId: string) => {
  const likeRef = fsDoc(db, `ideas/${ideaId}/likes/${userId}`);
  const docSnap = await getDoc(likeRef);
  return docSnap.exists();
};

export const getLikesCount = async (ideaId: string) => {
  const likesCol = fsCollection(db, `ideas/${ideaId}/likes`);
  const likesSnap = await getDocs(likesCol);
  return likesSnap.size;
};

// Comments logic
export interface IdeaComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

export const addComment = async (ideaId: string, authorId: string, authorName: string, text: string) => {
  const commentsCol = fsCollection(db, `ideas/${ideaId}/comments`);
  const docRef = await addDoc(commentsCol, {
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getComments = async (ideaId: string) => {
  const commentsCol = fsCollection(db, `ideas/${ideaId}/comments`);
  const q = query(commentsCol, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      authorId: data.authorId,
      authorName: data.authorName,
      text: data.text,
      createdAt: parseDate(data.createdAt),
    };
  });
};

export const deleteComment = async (ideaId: string, commentId: string) => {
  const commentRef = fsDoc(db, `ideas/${ideaId}/comments/${commentId}`);
  await deleteDoc(commentRef);
}; 

// Send a collaboration request
export const sendCollabRequest = async (req: Omit<CollaborationRequest, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'collabRequests'), {
      ...req,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

// Get collaboration requests for a user's ideas
export const getCollabRequestsForUser = async (userId: string) => {
  try {
    // Get all ideas by this user
    const ideasSnap = await getDocs(query(collection(db, 'ideas'), where('authorId', '==', userId)));
    const ideaIds = ideasSnap.docs.map(doc => doc.id);
    if (ideaIds.length === 0) return [];
    // Get all requests for these ideas
    const reqSnap = await getDocs(query(collection(db, 'collabRequests'), where('ideaId', 'in', ideaIds)));
    return reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CollaborationRequest[];
  } catch (error: any) {
    return [];
  }
}; 

// Accept a collaboration request
export const acceptCollabRequest = async (requestId: string) => {
  // Get the request
  const reqRef = doc(db, 'collabRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error('Request not found');
  const req = reqSnap.data();
  // Mark request as accepted
  await updateDoc(reqRef, { status: 'accepted' });
  // Add to idea collaborators
  const ideaRef = doc(db, 'ideas', req.ideaId);
  const ideaSnap = await getDoc(ideaRef);
  if (!ideaSnap.exists()) throw new Error('Idea not found');
  const idea = ideaSnap.data();
  const collaborators = Array.isArray(idea.collaborators) ? idea.collaborators : [];
  // Prevent duplicates
  if (!collaborators.some((c: any) => c.userId === req.requesterId)) {
    collaborators.push({
      userId: req.requesterId,
      name: req.requesterName,
      email: req.requesterEmail,
      github: req.requesterGithub,
      linkedin: req.requesterLinkedin,
    });
    await updateDoc(ideaRef, { collaborators });
  }
};

// Reject a collaboration request
export const rejectCollabRequest = async (requestId: string) => {
  const reqRef = doc(db, 'collabRequests', requestId);
  await updateDoc(reqRef, { status: 'rejected' });
}; 