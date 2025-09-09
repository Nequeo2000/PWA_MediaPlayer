let input = document.getElementById("input_element");
let settingsDialog = document.getElementById("settings_dialog");
let loadingDialog = document.querySelector("#loading_dialog");
let playerDialog = document.querySelector("#player_dialog");
let file_list = document.querySelector("#file_list");
let storageInfo = document.querySelector("#storageInfo");
let clearMemoryBtn = document.querySelector("#clear");

clearMemoryBtn.onclick = async () => {
    let entries = await OPFS.getEntries();
    let progressElement = loadingDialog.getElementsByTagName("progress")[0];
    progressElement.value = 0;
    progressElement.min = 0;
    progressElement.max = entries.length;

    loadingDialog.showModal();
    for (let entry of entries) {
        await OPFS.rootDirHandle.removeEntry(entry.name);
        progressElement.value++;
    }

    window.onload();
    loadingDialog.close();

    // stop playbac and reset media session
    player.pause();
    setMediaSession();
};
let volume_slider = document.querySelector("#volume_slider");
volume_slider.onchange = (event) => {
    let value = event.target.value;
    if (player) {
        player.volume = value;
    }
    localStorage.setItem("mediaVolume", value);
};
setTimeout(function _() {
    let localStorage_volume = parseFloat(localStorage.getItem("mediaVolume"));
    if (!localStorage_volume)
        setTimeout(_, 100);
    else
        volume_slider.value = parseFloat(localStorage.getItem("mediaVolume")) || 1;
});
let open_player_button_btn = document.querySelector("#open_player_button");
open_player_button_btn.onclick = (event) => {
    playerDialog.showModal();
};

let player = null;
let currentPlayingIndex = -1;
let defaultCoverImagePath = "./images/icon100.png";
let fileList = [];

input.onchange = async (event) => {
    if (!input.files.length)
        return;

    let progressElement = loadingDialog.getElementsByTagName("progress")[0];
    progressElement.value = 0;
    progressElement.min = 0;
    progressElement.max = input.files.length;

    loadingDialog.showModal();
    let files = event.target.files;
    window.file = files[0];
    for (let file of files) {
        await OPFS.save_file(file);
        progressElement.value++;
    }
    window.onload();
    loadingDialog.close();
}

function initPlayers() {
    player = document.getElementById("video");
    player.autoplay = true;
    player.controls = true;
    player.volume = parseFloat(localStorage.getItem("mediaVolume")) || 1;
}

function playIndex(index) {
    try {
        let file = fileList[index];
        if (file.type.split("/")[0] == "video"
            && currentPlayingIndex == index) {
            playerDialog.showModal();
            return;
        }

        currentPlayingIndex = index;
        if (player)
            player.pause();
        player.currentTime = 0;
        player.src = URL.createObjectURL(file);

        setMediaSession();
        open_player_button_btn.innerText = file.name;

        navigator.mediaSession.playAction();
    } catch (e) {
        for(let i in e){
            console.log(i + " : " + e[i]);
        }
    }
}

// window event handlers
window.onbeforeunload = (e) => {
    let media = document.getElementById("video");
    localStorage.setItem("mediaVolume", media.volume);
};

window.onload = async () => {
    initPlayers();
    //setMediaSession();

    file_list.innerHTML = "";
    // load file system
    let [directoryHandle, usage, quota] = await OPFS.initOPFS();
    // display file system information
    storageInfo.innerText = `${(usage / Math.pow(2, 2 * 10)).toFixed(2)} MB / ${(quota / Math.pow(2, 2 * 10)).toFixed(2)} MB`;

    // iterate of entries and display them
    loadingDialog.showModal();

    let entries = await OPFS.getEntries();
    for (let entry of entries) {
        let div = document.createElement("div");
        div.className = "file";
        div.onclick = () => playIndex(fileList.indexOf(entry));
        div.innerText = entry.name;
        file_list.appendChild(div);
    }
    fileList = [...entries];

    loadingDialog.close();
};

// Media Session API
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

    navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.fastSeek && 'fastSeek' in player) {
            player.fastSeek(details.seekTime);
            return;
        }
        player.currentTime = details.seekTime;
    });

    navigator.mediaSession.previousTrackAction = () => {
        playIndex((fileList.length + currentPlayingIndex - 1) % fileList.length);
    };
    navigator.mediaSession.setActionHandler("previoustrack", navigator.mediaSession.previousTrackAction);

    navigator.mediaSession.nextTrackAction = () => {
        playIndex((currentPlayingIndex + 1) % fileList.length);
    };
    navigator.mediaSession.setActionHandler("nexttrack", navigator.mediaSession.nextTrackAction);
}

// File System API
class OPFS {
    static rootDirHandle;

    static async initOPFS() {
        if (navigator.storage.getDirectory) {
            OPFS.rootDirHandle = await navigator.storage.getDirectory();
            let estimate = await navigator.storage.estimate();
            let quota = estimate.quota;
            let usage = estimate.usage;
            return [OPFS.rootDirHandle, usage, quota];
        } else {
            window.alert("FileSystem API not Available");
            return null;
        }
    }

    static async getInfo() {
        let estimate = await navigator.storage.estimate();
        let quota = estimate.quota;
        let usage = estimate.usage;
        return [quota, usage];
    }

    static async getEntries() {
        let files = [];
        let entries = await OPFS.rootDirHandle.entries();
        let entry = null;
        while ((entry = await entries.next())) {
            if (entry.done)
                return files;

            let fileHandle = entry.value[1];
            let file = await fileHandle.getFile();
            files.push(file);
        }
    }

    static async save_file(file) {
        let filename = file.name;
        let fileHandle = await OPFS.rootDirHandle.getFileHandle(filename, { create: true });
        if (fileHandle.createWritable) {
            let fileReadStream = await file.stream();
            let fileHandleWriteStream = await fileHandle.createWritable();
            await fileReadStream.pipeTo(fileHandleWriteStream);
        } else {
            let content = await OPFS.readAsArrayBuffer(file);
            await new Promise((resolve, reject) => {
                let worker = new Worker("./filewriter.js");
                worker.onmessage = (e) => {
                    resolve();
                    console.log(e.data);
                };

                worker.onerror = (e) => {
                    reject();
                    console.log(e.message);
                    console.log(e.lineno);
                    console.log(e.filename);
                    worker.terminate();
                };

                worker.postMessage([filename, content]);
            });
        }
    }

    static async readAsArrayBuffer(file) {
        let arrayBuffer = await new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onloadend = (e) => { resolve(e.target.result) };
            fileReader.onerror = () => { };
            fileReader.readAsArrayBuffer(file);
        });
        return arrayBuffer;
    }
}


// PWA SETUP
if ("serviceWorker" in navigator) {
    try {
        navigator.serviceWorker.register("./sw.js").then(e => { console.log(e) });
    } catch (error) {
        console.error(`Registration failed with ${error}`);
    }
}
