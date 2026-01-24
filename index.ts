interface MediaSession {
    playAction?: () => void;   // Or more specific: () => Promise<void>;
    previousTrackAction?: () => void;   // Or more specific: () => Promise<void>;
    nextTrackAction?: () => void;   // Or more specific: () => Promise<void>;
}

let filesystem !: FileSystemAccessAPI;
let input : HTMLInputElement = document.getElementById("input_element") as HTMLInputElement;
let settingsDialog : HTMLDialogElement = document.getElementById("settings_dialog") as HTMLDialogElement;
let loadingDialog : HTMLDialogElement = document.querySelector("#loading_dialog") as HTMLDialogElement;
let playerDialog : HTMLDialogElement = document.querySelector("#player_dialog") as HTMLDialogElement;
let file_list : HTMLDivElement = document.querySelector("#file_list") as HTMLDivElement;
let storageInfo : HTMLParagraphElement = document.querySelector("#storageInfo") as HTMLParagraphElement;
let clearMemoryBtn : HTMLButtonElement = document.querySelector("#clear") as HTMLButtonElement;
let open_player_button_btn : HTMLButtonElement = document.querySelector("#open_player_button") as HTMLButtonElement;
let file_elements_container: HTMLDivElement = document.querySelector("#file_elements_container") as HTMLDivElement;
let debug_flag_checkbox : HTMLInputElement = document.querySelector("#debug_mode_checkbox") as HTMLInputElement;

let player !: HTMLVideoElement;
let currentPlayingIndex: number = -1;
let defaultCoverImagePath: string = "./images/icon100.png";
let fileList: File[] = [];
let debug_flag : boolean = false;

setTimeout(function _() {
    let localStorage_debug_flag = localStorage.getItem("debug_flag") as string;
    if (!localStorage_debug_flag)
        setTimeout(_, 100);
    else {
        debug_flag_checkbox.checked = localStorage_debug_flag == "true" || false;
    }
});

clearMemoryBtn.onclick = async () => {
    let entries: File[] | undefined = await filesystem.getEntries();
    if (!entries) {
        console.log("Error in clearMemoryBtn.onclick : entries == null");
        return;
    }

    let progressElement = loadingDialog.getElementsByTagName("progress")[0];
    progressElement.value = 0;
    progressElement.max = entries.length;

    loadingDialog.showModal();
    for (let entry of entries) {
        filesystem.removeEntry(entry.name);
        progressElement.value++;
    }

    // @ts-ignore
    window.onload();
    loadingDialog.close();

    // stop playbac and reset media session
    player.pause();
    setMediaSession();
};

open_player_button_btn.onclick = (event) => {
    playerDialog.showModal();
};

input.onchange = async (event) => {
    if (!input.files) {
        console.log("Error in input.onchange : input.files == null");
        return;
    }
    if (!input.files.length) {
        console.log("Error in input.onchange : input.files.length == 0");
        return;
    }
    if (!event.target) {
        console.log("Error in input.onchange : event == null");
        return;
    }
    if ("files" in event.target == false) {
        console.log("Error in input.onchange : event.target.files does not exist");
        return;
    }
    if (!input.files.length)
        return;

    let progressElement = loadingDialog.getElementsByTagName("progress")[0];
    progressElement.value = 0;
    progressElement.max = input.files.length;

    loadingDialog.showModal();
    let files: FileList = event.target.files as FileList;
    for (let file of files) {
        await filesystem.save_file(file);
        progressElement.value++;
    }
    // @ts-ignore
    window.onload();
    loadingDialog.close();
}

debug_flag_checkbox.onchange = (event : Event) => {
    if(!event.target || "checked" in event.target == false){
        return;
    }
    if(event.target.checked == true){
        debug_flag = true;
        localStorage.setItem("debug_flag", "true");
    } else {
        debug_flag = false;
        localStorage.setItem("debug_flag", "false");
    }
}

function playIndex(index: number) {
    try {
        let file = fileList[index];
        /*
        if (file.type.split("/")[0] == "video"
            && currentPlayingIndex == index) {
            playerDialog.showModal();
            return;
        }
        */

        currentPlayingIndex = index;
        if (player)
            player.pause();
        player.currentTime = 0;
        player.src = URL.createObjectURL(file);

        setMediaSession();
        open_player_button_btn.innerText = file.name;

        if (navigator.mediaSession.playAction)
            navigator.mediaSession.playAction();
    } catch (error : any) {
        for(let i in error){
            console.log(i + " : " + error[i]);
        }
    }
}

// window event handlers
window.onbeforeunload = (e) => {
    localStorage.setItem("mediaVolume", player.volume.toString());
};

window.onload = async () => {
    if (!filesystem)
        filesystem = new FileSystemAccessAPI();
    filesystem.waitForInitilized(async () => {
        // Initialize player
        player = document.querySelector("#video") as HTMLVideoElement;
        player.autoplay = true;
        player.controls = true;
        player.volume = parseFloat(localStorage.getItem("mediaVolume") as string) || 1;
        //setMediaSession();

        file_elements_container.innerHTML = "";
        // load file system api
        let [usage, quota] = await filesystem.getInfo();
        // display file system api information
        storageInfo.innerText = `${(quota / Math.pow(2, 2 * 10)).toFixed(2)} MB / ${(usage / Math.pow(2, 2 * 10)).toFixed(2)} MB`;

        // iterate over entries and display them
        loadingDialog.showModal();
        let entries = await filesystem.getEntries();
        if (!entries) {
            console.log("Error in window.onload : entries == null");
            return;
        }
        for (let entry of entries) {
            let div = document.createElement("div");
            div.className = "file";
            div.onclick = () => playIndex(fileList.indexOf(entry));
            div.innerText = entry.name;
            file_elements_container.appendChild(div);
        }
        fileList = [...entries];
        loadingDialog.close();
    });
};

// BEGIN mediaSessionAPI
function setMediaSession() {
    let title = (fileList.length != 0) ? fileList[currentPlayingIndex].name : "";

    // test for media session api
    if (!("mediaSession" in navigator))
        return;
    if (navigator.mediaSession.metadata) {
        // set titel of mediaSession
        navigator.mediaSession.metadata.title = title;
        return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: "PWA MediaPlayer",
        album: " ",
        artwork: [
            {
                src: defaultCoverImagePath,
                sizes: "100x100",
                type: "image/png",
            }
        ],
    });

    navigator.mediaSession.playAction = () => {
        player.play()
            .then(() => {
                setMediaSession();
            });
        navigator.mediaSession.playbackState = "playing";
    };
    navigator.mediaSession.setActionHandler("play", navigator.mediaSession.playAction);

    navigator.mediaSession.setActionHandler("pause", () => {
        player.pause();
        navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler("seekto", (details: MediaSessionActionDetails) => {
        if (details.fastSeek && 'fastSeek' in player) {
            player.fastSeek(details.seekTime as number);
            return;
        }
        player.currentTime = details.seekTime as number;
    });

    navigator.mediaSession.previousTrackAction = () => {
        playIndex((fileList.length + currentPlayingIndex - 1) % fileList.length);
    };
    navigator.mediaSession.setActionHandler("previoustrack", navigator.mediaSession.previousTrackAction);

    navigator.mediaSession.nextTrackAction = () => {
        playIndex((fileList.length + currentPlayingIndex + 1) % fileList.length);
    };
    navigator.mediaSession.setActionHandler("nexttrack", navigator.mediaSession.nextTrackAction);
}
// END mediaSessionAPI

// PWA SETUP
if ("serviceWorker" in navigator) {
    try {
        navigator.serviceWorker.register("./sw.js").then(e => { console.log(e) });
    } catch (error) {
        console.error(`Registration failed with ${error}`);
    }
}
