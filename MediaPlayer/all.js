"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// BEGIN fileSystemAccess API
class FileSystemAccessAPI {
    constructor() {
        this.initialized = false;
        new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            FileSystemAccessAPI.rootDirHandle = yield navigator.storage.getDirectory();
            let estimate = yield navigator.storage.estimate();
            FileSystemAccessAPI.quota = estimate.quota;
            FileSystemAccessAPI.usage = estimate.usage;
            this.initialized = true;
        }));
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let estimate = yield navigator.storage.estimate();
            FileSystemAccessAPI.quota = estimate.quota;
            FileSystemAccessAPI.usage = estimate.usage;
            return [FileSystemAccessAPI.quota, FileSystemAccessAPI.usage];
        });
    }
    waitForInitilized(callback) {
        setTimeout(function _() {
            if (FileSystemAccessAPI.rootDirHandle) {
                callback();
            }
            else {
                setTimeout(_, 500);
            }
        }, 100);
    }
    getEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            let files = [];
            //let entries !: Iterator<{key: string, value: any}> | null;
            let entries;
            if ("entries" in FileSystemAccessAPI.rootDirHandle)
                entries = yield FileSystemAccessAPI.rootDirHandle.entries();
            if (!entries) {
                console.log("Error in getEntries(): entries == null");
                return;
            }
            let entry = null;
            while ((entry = yield entries.next())) {
                if (entry.done)
                    return files;
                let fileHandle = entry.value[1];
                let file = yield fileHandle.getFile();
                files.push(file);
            }
        });
    }
    save_file(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let filename = file.name;
            let fileHandle = yield FileSystemAccessAPI.rootDirHandle.getFileHandle(filename, { create: true });
            if (fileHandle.createWritable) {
                let fileReadStream = yield file.stream();
                let fileHandleWriteStream = yield fileHandle.createWritable();
                yield fileReadStream.pipeTo(fileHandleWriteStream);
            }
            else {
                let content = yield FileSystemAccessAPI.readAsArrayBuffer(file);
                yield new Promise((resolve, reject) => {
                    let worker = new Worker("./filewriter.js");
                    worker.onmessage = (e) => {
                        resolve(null);
                        worker.terminate();
                    };
                    worker.onerror = (e) => {
                        reject();
                        worker.terminate();
                    };
                    worker.postMessage([filename, content]);
                });
            }
        });
    }
    static readAsArrayBuffer(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let arrayBuffer = yield new Promise((resolve, reject) => {
                let fileReader = new FileReader();
                fileReader.onloadend = (event) => {
                    if (event)
                        if (event.target)
                            if ("result" in event.target)
                                resolve(event.target.result);
                };
                fileReader.onerror = (event) => {
                    console.log("Error in readAsArrayBuffer: fileReader.onerror");
                };
                fileReader.readAsArrayBuffer(file);
            });
            return arrayBuffer;
        });
    }
    removeEntry(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield FileSystemAccessAPI.rootDirHandle.removeEntry(name);
        });
    }
}
// END fileSystemAccess API
self.addEventListener("message", (e) => __awaiter(void 0, void 0, void 0, function* () {
    //postMessage("WORKER");
    let data = e.data;
    let name = data[0];
    let arrayBuffer = data[1];
    let rootDirHandle = yield navigator.storage.getDirectory();
    let fileHandle = yield rootDirHandle.getFileHandle(name, { create: true });
    let accessHandle;
    if ("createSyncAccessHandle" in fileHandle)
        accessHandle = yield fileHandle.createSyncAccessHandle();
    let writeSize;
    if (accessHandle)
        writeSize = accessHandle.write(arrayBuffer, { "at": 0 });
    //accessHandle.truncate(writeSize);
    accessHandle.close();
    postMessage("");
}));
let filesystem;
let input = document.getElementById("input_element");
let settingsDialog = document.getElementById("settings_dialog");
let loadingDialog = document.querySelector("#loading_dialog");
let playerDialog = document.querySelector("#player_dialog");
let file_list = document.querySelector("#file_list");
let storageInfo = document.querySelector("#storageInfo");
let clearMemoryBtn = document.querySelector("#clear");
let open_player_button_btn = document.querySelector("#open_player_button");
let file_elements_container = document.querySelector("#file_elements_container");
let debug_flag_checkbox = document.querySelector("#debug_mode_checkbox");
let player;
let currentPlayingIndex = -1;
let defaultCoverImagePath = "./images/icon100.png";
let fileList = [];
let debug_flag = false;
setTimeout(function _() {
    let localStorage_debug_flag = localStorage.getItem("debug_flag");
    if (!localStorage_debug_flag)
        setTimeout(_, 100);
    else {
        debug_flag_checkbox.checked = localStorage_debug_flag == "true" || false;
    }
});
clearMemoryBtn.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    let entries = yield filesystem.getEntries();
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
});
open_player_button_btn.onclick = (event) => {
    playerDialog.showModal();
};
input.onchange = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
    let files = event.target.files;
    for (let file of files) {
        yield filesystem.save_file(file);
        progressElement.value++;
    }
    // @ts-ignore
    window.onload();
    loadingDialog.close();
});
debug_flag_checkbox.onchange = (event) => {
    if (!event.target || "checked" in event.target == false) {
        return;
    }
    if (event.target.checked == true) {
        debug_flag = true;
        localStorage.setItem("debug_flag", "true");
    }
    else {
        debug_flag = false;
        localStorage.setItem("debug_flag", "false");
    }
};
function playIndex(index) {
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
    }
    catch (error) {
        for (let i in error) {
            console.log(i + " : " + error[i]);
        }
    }
}
// window event handlers
window.onbeforeunload = (e) => {
    localStorage.setItem("mediaVolume", player.volume.toString());
};
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!filesystem)
        filesystem = new FileSystemAccessAPI();
    filesystem.waitForInitilized(() => __awaiter(void 0, void 0, void 0, function* () {
        // Initialize player
        player = document.querySelector("#video");
        player.autoplay = true;
        player.controls = true;
        player.volume = parseFloat(localStorage.getItem("mediaVolume")) || 1;
        //setMediaSession();
        file_elements_container.innerHTML = "";
        // load file system api
        let [usage, quota] = yield filesystem.getInfo();
        // display file system api information
        storageInfo.innerText = `${(quota / Math.pow(2, 2 * 10)).toFixed(2)} MB / ${(usage / Math.pow(2, 2 * 10)).toFixed(2)} MB`;
        // iterate over entries and display them
        loadingDialog.showModal();
        let entries = yield filesystem.getEntries();
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
    }));
});
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
        playIndex((fileList.length + currentPlayingIndex + 1) % fileList.length);
    };
    navigator.mediaSession.setActionHandler("nexttrack", navigator.mediaSession.nextTrackAction);
}
// END mediaSessionAPI
// PWA SETUP
if ("serviceWorker" in navigator) {
    try {
        navigator.serviceWorker.register("./sw.js").then(e => { console.log(e); });
    }
    catch (error) {
        console.error(`Registration failed with ${error}`);
    }
}
class MediaPlayerUI extends HTMLElement {
    constructor() {
        super();
        this.randomizer_active = false;
    }
    connectedCallback() {
        //let filename = this.getAttribute("filename");
        this.innerHTML = `
            <style>
                * {
                    width: 100%;
                }
                
                .container {
                    display: grid;
                    grid-template-rows: 75% 1fr;
                    height: 100%;
                    width: 100%;
                    max-height: 100%;
                }

                .container #interaction_button_container {
                    display: grid;
                    grid-template-rows: repeat(3, var(--input_element_height));
                    gap: 15px;
                    height: 100%;
                    width: 100%;
                }

                button {
                    height: 3em;
                    margin-bottom: 15px;
                }

                input[type=range] {
                    -webkit-appearance: none;
                    width: 100%;
                    background: #d3d3d3;
                    outline: none;
                    opacity: 0.7;
                    -webkit-transition: .2s;
                    transition: opacity .2s;
                }

                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 25px;
                    height: 25px;
                    background: #000000;
                    cursor: pointer;
                }
            </style>
            <div class="container">
                <div style="align-content: center;">
                    <video id="video" playsinline playsinline onended='navigator.mediaSession.nextTrackAction();'></video>
                </div>
                <div id="interaction_button_container">
                    <div style="display: flex; flex-direction: row;">
                        <button onclick='navigator.mediaSession.previousTrackAction();'>Backward</button>
                        <button onclick='navigator.mediaSession.nextTrackAction();'>Forward</button>
                    </div>
                    <div style="display: flex; flex-direction: row;">
                        <button id="equalizer_button">
                            <svg fill="#000000" height="100%" viewBox="0 0 8 8" style="stroke:black; stroke-width:0.5">
                                <line x1="2" y1="1" x2="2" y2="7"/>
                                <line x1="4" y1="1" x2="4" y2="7"/>
                                <line x1="6" y1="1" x2="6" y2="7"/>
                                <circle r="0.5" cx="2" cy="2"/>
                                <circle r="0.5" cx="4" cy="6"/>
                                <circle r="0.5" cx="6" cy="4"/>
                            </svg>
                        </button>
                        <button id="randomizer_button">
                            <svg style="fill: var(--randomizer_button_color)" height="100%" viewBox="0 -4 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m24.983 8.539v-2.485h-4.902l-3.672 5.945-2.099 3.414-3.24 5.256c-.326.51-.889.844-1.53.845h-9.54v-3.568h8.538l3.673-5.946 2.099-3.414 3.24-5.256c.325-.509.886-.843 1.525-.845h5.904v-2.485l7.417 4.27-7.417 4.27z"/><path d="m12.902 6.316-.63 1.022-1.468 2.39-2.265-3.675h-8.538v-3.568h9.54c.641.001 1.204.335 1.526.838l.004.007 1.836 2.985z"/><path d="m24.983 24v-2.485h-5.904c-.639-.002-1.201-.336-1.521-.838l-.004-.007-1.836-2.985.63-1.022 1.468-2.39 2.264 3.675h4.902v-2.485l7.417 4.27-7.417 4.27z"/></svg>
                        </button>
                    </div>
                    <input type="range" id="volume_slider" min="0" max="1" step="0.01">
                </div>
            </div>
            <dialog id="eq_options_dialog">
                <div class="controls">
                    <label>60Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 0);"></input>
                    <output id="gain0">0 dB</output>
                </div>
                <div class="controls">
                    <label>170Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 1);"></input>
                    <output id="gain1">0 dB</output>
                </div>
                <div class="controls">
                    <label>350Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 2);"></input>
                    <output id="gain2">0 dB</output>
                </div>
                <div class="controls">
                    <label>1000Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 3);"></input>
                    <output id="gain3">0 dB</output>
                </div>
                <div class="controls">
                    <label>3500Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 4);"></input>
                    <output id="gain4">0 dB</output>
                </div>
                <div class="controls">
                    <label>10000Hz</label>
                    <input type="range" value="0" step="1" min="-10" max="10" oninput="changeGain(this.value, 5);"></input>
                    <output id="gain5">0 dB</output>
                </div>
                <!--
                    reset button -> localStorage und input elemente auf 0
                    html drop down menu HTMLSelectElement geüllt mit HTMLOptionElement
                -->
                <button id="eq_dialog_close_button">Close</button>
            </dialog>
        `;
        let player = this.querySelector("#video");
        player.autoplay = true;
        player.controls = true;
        player.volume = parseFloat(localStorage.getItem("mediaVolume")) || 1;
        let volume_slider = this.querySelector("#volume_slider");
        let localStorage_volume = parseFloat(localStorage.getItem("mediaVolume"));
        volume_slider.value = localStorage_volume.toString() || "1";
        volume_slider.onchange = (event) => {
            if (event.target && "value" in event.target) {
                let value = event.target.value;
                if (player) {
                    player.volume = value;
                }
                localStorage.setItem("mediaVolume", value.toString());
            }
        };
        let eq_options_dialog = this.querySelector("#eq_options_dialog");
        let eq_dialog_close_button = this.querySelector("#eq_dialog_close_button");
        eq_dialog_close_button.onclick = () => {
            eq_options_dialog.close();
        };
        let equalizer_button = this.querySelector("#equalizer_button");
        equalizer_button.onclick = () => {
            eq_options_dialog.showModal();
        };
        let randomizer_button = this.querySelector("#randomizer_button");
        randomizer_button.onclick = () => {
            this.randomizer_active = !this.randomizer_active;
            let svg_element = randomizer_button.querySelector("svg");
            // Adjust Styling of svg inside button
            if (svg_element)
                if (this.randomizer_active)
                    svg_element.style.setProperty("--randomizer_button_color", "blue");
                else
                    svg_element.style.setProperty("--randomizer_button_color", "black");
            window.randomizer_active = this.randomizer_active;
            // Test if #file_elements_container is available
            if (file_elements_container) {
                // Randomize order of content
                const children = file_elements_container.children;
                for (const child of children) {
                    let last_child = file_elements_container.lastChild;
                    if (last_child && last_child !== child) {
                        last_child.after(child);
                    }
                }
            }
        };
        let element = this;
        setTimeout(function _() {
            if (element.isConnected)
                element.initEQ(player);
            else
                setTimeout(_, 100);
        }, 100);
    }
    disconnectedCallback() {
    }
    adoptedCallback() {
    }
    attributeChangedCallback() {
    }
    initEQ(player) {
        // Implementing the equalizer
        var ctx = window.AudioContext;
        var context = new ctx();
        var sourceNode = context.createMediaElementSource(player);
        // create the equalizer. It's a set of biquad Filters
        var filters = [];
        // Set filters
        [60, 170, 350, 1000, 3500, 10000].forEach(function (freq, i) {
            var eq = context.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = parseFloat(localStorage.getItem("eq_slide_" + freq)) || 0;
            filters.push(eq);
        });
        // Connect filters in series
        sourceNode.connect(filters[0]);
        for (var i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }
        // connect the last filter to the speakers
        filters[filters.length - 1].connect(context.destination);
        // @ts-ignore
        window["changeGain"] = (sliderVal, nbFilter) => {
            var value = parseFloat(sliderVal);
            filters[nbFilter].gain.value = value;
            // update output labels
            var output = document.querySelector("#gain" + nbFilter);
            output.value = value + " dB";
            // Store change to localStorage
            localStorage.setItem("eq_slide_" + nbFilter, sliderVal);
        };
        // Update input element value
        [60, 170, 350, 1000, 3500, 10000].forEach(function (freq, i) {
            let output_element = document.body.querySelector("#gain" + i);
            let parent_element = output_element.parentElement;
            let input_element = parent_element.querySelector("input");
            input_element.value = localStorage.getItem("eq_slide_" + i);
        });
        player.onplay = () => {
            context.resume();
        };
    }
}
window.customElements.define("media-player-ui", MediaPlayerUI);
