import { sum, isEven } from './utils.js';
import { Button, createButton } from './components/Button.js';
import Modal from './components/Modal.js';
import { ApiService, apiService } from './services/api.js';
import { debounce, throttle, deepClone } from './utils/helpers.js';
import { APP_NAME, VERSION, API_ENDPOINTS, HTTP_STATUS } from './constants/index.js';
import { User, Post, Comment, DataTypes } from './types/index.js';

class App {
    constructor() {
        this.name = APP_NAME;
        this.version = VERSION;
        this.components = new Map();
        this.services = new Map();
        this.init();
    }
    
    init() {
        console.log(`Initializing ${this.name} v${this.version}`);
        this.setupServices();
        this.setupComponents();
        this.setupEventHandlers();
    }
    
    setupServices() {
        this.services.set('api', apiService);
        console.log('Services initialized');
    }
    
    setupComponents() {
        const button = createButton('Test Button', 'app.handleClick()');
        const modal = new Modal('Test Modal', 'This is a test modal content');
        
        this.components.set('button', button);
        this.components.set('modal', modal);
        console.log('Components initialized');
    }
    
    setupEventHandlers() {
        const debouncedHandler = debounce(this.handleResize.bind(this), 300);
        const throttledHandler = throttle(this.handleScroll.bind(this), 100);
        if(typeof window !== 'undefined') {
            window.addEventListener('resize', debouncedHandler);
            window.addEventListener('scroll', throttledHandler);
        }
    }
    
    handleClick() {
        console.log('Button clicked!');
        const result = sum(10, 20);
        console.log(`Sum result: ${result}`);
        console.log(`Is 10 even? ${isEven(10)}`);
    }
    
    handleResize() {
        console.log('Window resized (debounced)');
    }
    
    handleScroll() {
        console.log('Window scrolled (throttled)');
    }
    
    async loadData() {
        try {
            const users = await this.services.get('api').get(API_ENDPOINTS.USERS);
            const posts = await this.services.get('api').get(API_ENDPOINTS.POSTS);
            
            return {
                users: users.map(userData => new User(userData.id, userData.name, userData.email)),
                posts: posts.map(postData => new Post(postData.id, postData.title, postData.content, postData.authorId))
            };
        } catch (error) {
            console.error('Failed to load data:', error);
            return { users: [], posts: [] };
        }
    }
    
    render() {
        const button = this.components.get('button');
        const modal = this.components.get('modal');
        
        return `
            <div class="app">
                <header>
                    <h1>${this.name}</h1>
                    <p>Version: ${this.version}</p>
                </header>
                <main>
                    ${button.render()}
                    ${modal.render()}
                </main>
            </div>
        `;
    }
}

export default App; 