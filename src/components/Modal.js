import { Button } from './Button.js';

export class Modal {
    constructor(title, content) {
        this.title = title;
        this.content = content;
        this.closeButton = new Button('Close', 'this.close()');
    }
    
    render() {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h2>${this.title}</h2>
                    ${this.closeButton.render()}
                </div>
                <div class="modal-content">
                    ${this.content}
                </div>
            </div>
        `;
    }
    
    close() {
        console.log('Modal closed');
    }
}

export default Modal; 