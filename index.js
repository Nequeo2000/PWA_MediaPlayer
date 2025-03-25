let input = document.getElementById("input");
let player = null;
let currentPlayingIndex = 0;
let defaultCoverImagePath = "./images/icon100.png";
let fileList = [];

function loadFileElements(){
    let tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    for (let file of fileList) {
        tableBody.innerHTML += `
            <div class="media" index="${fileList.indexOf(file)}"
            onclick="playIndex(${fileList.indexOf(file)});">
                ${file.name}
            </div>
        `;
    }
}

input.onchange = (event) => {
    if(!input.files.length)
        return;
    fileList = [...input.files];
    loadFileElements();
}

function initPlayers() {
    player = document.getElementById("video");
    player.autoplay = true;
    player.controls = true;
    player.volume = parseFloat(localStorage.getItem("mediaVolume"));
    /*
    // now inside of index.html
    player.onended = () => {
        navigator.mediaSession.nextTrackAction();
    };    
    */
}

function playIndex(index) {
    currentPlayingIndex = index;

    if (player) // if already playing, stop playing
        player.pause();

    player.currentTime = 0;
    player.src = URL.createObjectURL(fileList[index]);
    setMediaSession();

    navigator.mediaSession.playAction();

    let titleContainer = document.getElementById("mediaTitleContainer");
    titleContainer.innerText = fileList[currentPlayingIndex].name;
}


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
        playIndex( (fileList.length + currentPlayingIndex - 1) % fileList.length );
    };
    navigator.mediaSession.setActionHandler("previoustrack", navigator.mediaSession.previousTrackAction);

    navigator.mediaSession.nextTrackAction = () => {
        playIndex( (fileList.length + currentPlayingIndex + 1) % fileList.length );
    };
    navigator.mediaSession.setActionHandler("nexttrack", navigator.mediaSession.nextTrackAction);
}

// window event handlers
window.onbeforeunload = (e)=>{
    let media = document.getElementById("video");
    localStorage.setItem("mediaVolume", media.volume);
};

window.onload = ()=>{
    initPlayers();
    setMediaSession();
};

// PWA SETUP
if ("serviceWorker" in navigator) {
    try {
        navigator.serviceWorker.register("./sw.js").then(e => { console.log(e) });
    } catch (error) {
        console.error(`Registration failed with ${error}`);
    }
}
