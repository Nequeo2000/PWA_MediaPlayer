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

async function save_file(file) {
    let filename = file.name;
    let fileHandle = await rootDirHandle.getFileHandle(filename, { create: true });
    if(fileHandle.createWritable){
        let fileReadStream = await file.stream();
        let fileHandleWriteStream = await fileHandle.createWritable();
        await fileReadStream.pipeTo(fileHandleWriteStream);
    } else {
        let content = await readAsArrayBuffer(file);
        await new Promise((resolve, reject)=>{
            let worker = new Worker("./filewriter.js");
            
            worker.onmessage = (e)=>{
                resolve();
                worker.terminate();
            };

            worker.onerror = (e)=>{
                reject();
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
