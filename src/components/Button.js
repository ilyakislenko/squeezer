export class Button {
    constructor(text, onClick) {
        this.text = text;
        this.onClick = onClick;
    }
    
    render() {
        return `<button onclick="${this.onClick}">${this.text}</button>`;
    }
}

export function createButton(text, onClick) {
    return new Button(text, onClick);
}

export default Button; 