let rootDirHandle;

async function initOPFS() {
    rootDirHandle = await navigator.storage.getDirectory();
    let estimate = await navigator.storage.estimate();
    let quota = estimate.quota;
    let usage = estimate.usage;
    return [rootDirHandle, usage, quota];
}

async function getInfo() {
    let estimate = await navigator.storage.estimate();
    let quota = estimate.quota;
    let usage = estimate.usage;
    return [quota, usage];
}

async function getEntries() {
    let files = [];
    let entries = await rootDirHandle.entries();
    let entry = null;
    while( (entry = await entries.next()) ){
        if (entry.done)
            return files;
        
        let fileHandle = entry.value[1];
        let file = await fileHandle.getFile();
        files.push(file);
    }
}

function write_to_file(filename, content) {
    if(window.Worker){
        new Promise((resolve, reject)=>{
            let worker = new Worker("./filewriter.js");
            worker.onmessage = (e)=>{
                if(e.data.debug){
                    console.log(e.data.debug);
                    return;
                }
                console.log(e.data);

                resolve();
                console.log("Promise resolved");
                worker.terminate();
                console.log("Worker terminated");
            };

            worker.onmessageerror = (e)=>{
                console.log("message error ",  e);
            };

            worker.onerror = (e)=>{
                console.log("ERROR");

                worker.terminate();
            };

            worker.postMessage([filename, content]);
        });
    }
}

async function readAsArrayBuffer(file){
    let arrayBuffer = await new Promise((resolve, reject)=>{
        let fileReader = new FileReader();
        fileReader.onloadend = (e)=>{resolve(e.target.result)};
        fileReader.onerror = ()=>{};
        fileReader.readAsArrayBuffer(file);
    });
    return arrayBuffer;
}
