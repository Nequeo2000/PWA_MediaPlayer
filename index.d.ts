interface MediaSession {
    playAction?: () => void;
    previousTrackAction?: () => void;
    nextTrackAction?: () => void;
}
declare let filesystem: FileSystemAccessAPI;
declare let input: HTMLInputElement;
declare let settingsDialog: HTMLDialogElement;
declare let loadingDialog: HTMLDialogElement;
declare let playerDialog: HTMLDialogElement;
declare let file_list: HTMLDivElement;
declare let storageInfo: HTMLParagraphElement;
declare let clearMemoryBtn: HTMLButtonElement;
declare let open_player_button_btn: HTMLButtonElement;
declare let file_elements_container: HTMLDivElement;
declare let debug_flag_checkbox: HTMLInputElement;
declare let player: HTMLVideoElement;
declare let currentPlayingIndex: number;
declare let defaultCoverImagePath: string;
declare let fileList: File[];
declare let debug_flag: boolean;
declare function playIndex(index: number): void;
declare function setMediaSession(): void;
