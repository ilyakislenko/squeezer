export class User {
    constructor(id, name, email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email
        };
    }
}

export class Post {
    constructor(id, title, content, authorId) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.authorId = authorId;
        this.createdAt = new Date();
    }
}

export class Comment {
    constructor(id, content, postId, authorId) {
        this.id = id;
        this.content = content;
        this.postId = postId;
        this.authorId = authorId;
        this.createdAt = new Date();
    }
}

export const DataTypes = {
    USER: 'user',
    POST: 'post',
    COMMENT: 'comment'
};

export default {
    User,
    Post,
    Comment,
    DataTypes
}; 