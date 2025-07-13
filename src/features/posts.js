import { apiService } from '../services/api.js';
import { Post, Comment } from '../types/index.js';
import { API_ENDPOINTS } from '../constants/index.js';

class PostService {
    async getAllPosts() {
        try {
            const posts = await apiService.get(API_ENDPOINTS.POSTS);
            return posts.map(postData => new Post(postData.id, postData.title, postData.content, postData.authorId));
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            return [];
        }
    }
    
    async getPostById(id) {
        try {
            const postData = await apiService.get(`${API_ENDPOINTS.POSTS}/${id}`);
            return new Post(postData.id, postData.title, postData.content, postData.authorId);
        } catch (error) {
            throw new Error(`Failed to fetch post ${id}: ${error.message}`);
        }
    }
    
    async createPost(title, content, authorId) {
        try {
            const postData = await apiService.post(API_ENDPOINTS.POSTS, { title, content, authorId });
            return new Post(postData.id, postData.title, postData.content, postData.authorId);
        } catch (error) {
            throw new Error(`Failed to create post: ${error.message}`);
        }
    }
    
    async updatePost(id, updates) {
        try {
            const postData = await apiService.post(`${API_ENDPOINTS.POSTS}/${id}`, updates);
            return new Post(postData.id, postData.title, postData.content, postData.authorId);
        } catch (error) {
            throw new Error(`Failed to update post ${id}: ${error.message}`);
        }
    }
    
    async deletePost(id) {
        try {
            await apiService.post(`${API_ENDPOINTS.POSTS}/${id}/delete`, {});
            return true;
        } catch (error) {
            throw new Error(`Failed to delete post ${id}: ${error.message}`);
        }
    }
    
    async getCommentsForPost(postId) {
        try {
            const comments = await apiService.get(`${API_ENDPOINTS.COMMENTS}?postId=${postId}`);
            return comments.map(commentData => new Comment(commentData.id, commentData.content, commentData.postId, commentData.authorId));
        } catch (error) {
            console.error(`Failed to fetch comments for post ${postId}:`, error);
            return [];
        }
    }
    
    async addComment(postId, content, authorId) {
        try {
            const commentData = await apiService.post(API_ENDPOINTS.COMMENTS, { postId, content, authorId });
            return new Comment(commentData.id, commentData.content, commentData.postId, commentData.authorId);
        } catch (error) {
            throw new Error(`Failed to add comment: ${error.message}`);
        }
    }
}

export const postService = new PostService();
export default PostService; 