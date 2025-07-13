export const APP_NAME = 'Squeezer App';
export const VERSION = '1.0.0';
export const API_ENDPOINTS = {
    USERS: '/api/users',
    POSTS: '/api/posts',
    COMMENTS: '/api/comments'
};
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
export const EVENTS = {
    CLICK: 'click',
    SUBMIT: 'submit',
    CHANGE: 'change',
    LOAD: 'load'
};

const config = {
    debug: process.env.NODE_ENV === 'development',
    timeout: 5000,
    retries: 3
};

export default config; 