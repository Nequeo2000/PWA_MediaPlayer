interface Window {
    randomizer_active?: boolean;
}
declare class MediaPlayerUI extends HTMLElement {
    randomizer_active: boolean;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    adoptedCallback(): void;
    attributeChangedCallback(): void;
    initEQ(player: HTMLMediaElement): void;
}
