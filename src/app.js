import { Button, createButton } from './components/Button.js';
import Modal from './components/Modal.js';
import { ApiService } from './services/api.js';
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
        this.renderToDOM();
    }

    setupServices() {
        this.services.set('api', new ApiService());
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
        this.showModal();
    }

    handleResize() {
        console.log('Window resized (debounced)');
    }

    handleScroll() {
        console.log('Window scrolled (throttled)');
    }

    showModal() {
        const modal = this.components.get('modal');
        if (modal && typeof window !== 'undefined') {
            // Создаем модальное окно в DOM
            const modalElement = document.createElement('div');
            modalElement.className = 'modal show';
            modalElement.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${modal.title}</h2>
                        <button onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                    <div class="modal-body">
                        ${modal.content}
                    </div>
                </div>
            `;
            document.body.appendChild(modalElement);
            
            // Закрытие по клику вне модального окна
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    modalElement.remove();
                }
            });
        }
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
                    <div class="stats">
                        <div class="stat-card">
                            <h3>App Status</h3>
                            <p>Running</p>
                        </div>
                        <div class="stat-card">
                            <h3>Components</h3>
                            <p>${this.components.size}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Services</h3>
                            <p>${this.services.size}</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <button onclick="app.handleClick()">Open Modal</button>
                        <button onclick="app.loadData().then(data => console.log('Loaded data:', data))">Load Data</button>
                    </div>
                </main>
            </div>
        `;
    }

    renderToDOM() {
        if (typeof window !== 'undefined') {
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.innerHTML = this.render();
                console.log('App rendered to DOM');
            }
        }
    }
}

export default App; 