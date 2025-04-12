self.addEventListener("message", async (e)=>{
    //postMessage("WORKER");
    postMessage({debug: "0"});
    let data = e.data;
    let name = data[0];
    let arrayBuffer = data[1];
    postMessage({debug: "1"});
    
    let rootDirHandle = await navigator.storage.getDirectory();
    postMessage({debug: "2"});
    let fileHandle = await rootDirHandle.getFileHandle(name, { create: true });
    postMessage({debug: "3"});
    let accessHandle = await fileHandle.createSyncAccessHandle();
    postMessage({debug: "4"});
    
    let writeSize = accessHandle.write(arrayBuffer, {"at": 0});
    postMessage({debug: "5"});
    //accessHandle.truncate(writeSize);
    accessHandle.close();
    postMessage({debug: "6"});
    postMessage("");
    /* 
    */
});