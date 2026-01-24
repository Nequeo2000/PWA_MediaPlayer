interface Window {
    randomizer_active?: boolean;
}

class MediaPlayerUI extends HTMLElement {
    public randomizer_active = false;

    constructor() {
        super();
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

        let player = this.querySelector("#video") as HTMLVideoElement;
        player.autoplay = true;
        player.controls = true;
        player.volume = parseFloat(localStorage.getItem("mediaVolume") as string) || 1;

        let volume_slider: HTMLInputElement = this.querySelector("#volume_slider") as HTMLInputElement;
        let localStorage_volume = parseFloat(localStorage.getItem("mediaVolume") as string);
        volume_slider.value = localStorage_volume.toString() || "1";
        volume_slider.onchange = (event: Event) => {
            if (event.target && "value" in event.target) {
                let value: number = event.target.value as number;
                if (player) {
                    player.volume = value;
                }
                localStorage.setItem("mediaVolume", value.toString());
            }
        };

        let eq_options_dialog = this.querySelector("#eq_options_dialog") as HTMLDialogElement;
        let eq_dialog_close_button = this.querySelector("#eq_dialog_close_button") as HTMLDialogElement;
        eq_dialog_close_button.onclick = () => {
            eq_options_dialog.close();
        };
        let equalizer_button = this.querySelector("#equalizer_button") as HTMLButtonElement;
        equalizer_button.onclick = () => {
            eq_options_dialog.showModal();
        };
        let randomizer_button = this.querySelector("#randomizer_button") as HTMLButtonElement;
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

            // Test if fileList is available
            if (fileList) {
                // Randomize order of content
                for(let i=0;i<fileList.length;i++){
                    const entry = fileList[i];
                    fileList.splice(i, 1);
                    fileList.push(entry);
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

    initEQ(player: HTMLMediaElement) {
        // Implementing the equalizer
        var ctx = window.AudioContext;
        var context = new ctx();
        var sourceNode = context.createMediaElementSource(player);
        // create the equalizer. It's a set of biquad Filters
        var filters = [] as Array<BiquadFilterNode>;
        // Set filters
        [60, 170, 350, 1000, 3500, 10000].forEach(function (freq, i) {
            var eq = context.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = parseFloat(localStorage.getItem("eq_slide_" + freq) as string) || 0;
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
        window["changeGain"] = (sliderVal: string, nbFilter: number) => {
            var value = parseFloat(sliderVal);
            filters[nbFilter].gain.value = value;

            // update output labels
            var output = document.querySelector("#gain" + nbFilter) as HTMLOutputElement;
            output.value = value + " dB";

            // Store change to localStorage
            localStorage.setItem("eq_slide_" + nbFilter, sliderVal);
        };
        // Update input element value
        [60, 170, 350, 1000, 3500, 10000].forEach(function (freq, i) {
            let output_element = document.body.querySelector("#gain" + i) as HTMLOutputElement;
            let parent_element = output_element.parentElement as HTMLDivElement;
            let input_element = parent_element.querySelector("input") as HTMLInputElement;
            input_element.value = localStorage.getItem("eq_slide_" + i) as string;
        });

        player.onplay = () => {
            context.resume();
        };
    }
}
window.customElements.define("media-player-ui", MediaPlayerUI);