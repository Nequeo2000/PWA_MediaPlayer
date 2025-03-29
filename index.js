let input = document.getElementById("input");
let settingsDialog = document.getElementById("settings");
let loadingDialog = document.querySelector("#loading");
let playerDialog = document.querySelector("#player");
let mediaList = document.querySelector("#mediaList");
let storageInfo = document.querySelector("#storageInfo");
let clearMemoryBtn = document.querySelector("#clear");
clearMemoryBtn.onclick = async ()=>{
    loadingDialog.showModal();
    let entries = await getEntries();
    for(let entry of entries){
        await rootDirHandle.removeEntry(entry.name);
    }
    window.onload();
    loadingDialog.close();
};

let player = null;
let currentPlayingIndex = -1;
let defaultCoverImagePath = "./images/icon100.png";
let fileList = [];

input.onchange = async (event) => {
    loadingDialog.showModal();
    if(!input.files.length)
        return;
    let files = event.target.files;
    for (let file of files) {
        //let fileReadStream = await file.stream();
        //let fileHandle = await rootDirHandle.getFileHandle(file.name, { create: true });
        //let fileHandleWriteStream = await fileHandle.createWritable();
        //await fileReadStream.pipeTo(fileHandleWriteStream);

        let arrayBuffer = await readAsArrayBuffer(file);
        await write_to_file(file.name, arrayBuffer);
    }
    window.onload();
    loadingDialog.close();
}

function initPlayers() {
    player = document.getElementById("video");
    player.autoplay = true;
    player.controls = true;
    player.volume = parseFloat(localStorage.getItem("mediaVolume")) || 1;
    /*
    // now inside of index.html
    player.onended = () => {
        navigator.mediaSession.nextTrackAction();
    };    
    */
}

function playIndex(index) {
    let file = fileList[index];
    if(file.type.split("/")[0] == "video"
    && currentPlayingIndex == index ){
        playerDialog.showModal();
        return;
    }
    
    currentPlayingIndex = index;
    if (player) // if already playing, stop playing
        player.pause();

    player.currentTime = 0;
    player.src = URL.createObjectURL(file);
    setMediaSession();

    navigator.mediaSession.playAction();
}

// window event handlers
window.onbeforeunload = (e)=>{
    let media = document.getElementById("video");
    localStorage.setItem("mediaVolume", media.volume);
};

window.onload = async ()=>{
    initPlayers();
    setMediaSession();

    mediaList.innerHTML = "";
    // load file system
    let [directoryHandle, usage, quota] = await initOPFS();
    rootDirHandle = directoryHandle;
    // display file system information
    storageInfo.innerText = `${(usage / Math.pow(2, 2 * 10)).toFixed(2)} MB / ${(quota / Math.pow(2, 2 * 10)).toFixed(2)} MB`;

    // iterate of entries and display them
    loadingDialog.showModal();
    
    let entries = await getEntries();
    for(let entry of entries){
        let div = document.createElement("div");
        div.className = "file";
        div.onclick = ()=>playIndex(fileList.indexOf(entry));
        div.innerText = entry.name;
        mediaList.appendChild(div);
    }
    fileList = [...entries];

    loadingDialog.close();
};

// PWA SETUP
if ("serviceWorker" in navigator) {
    try {
        navigator.serviceWorker.register("./sw.js").then(e => { console.log(e) });
    } catch (error) {
        console.error(`Registration failed with ${error}`);
    }
}