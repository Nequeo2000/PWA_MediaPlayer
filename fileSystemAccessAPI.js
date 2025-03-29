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


async function write_to_file(filename, content) {
    if(window.Worker){
        let worker = await new Worker("filewriter.js");
        await new Promise((resolve, reject)=>{
            worker.onmessage = (e)=>{
                resolve();
            };
            worker.postMessage([filename, content]);
        });
        worker.terminate();
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