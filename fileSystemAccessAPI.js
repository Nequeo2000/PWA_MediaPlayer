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