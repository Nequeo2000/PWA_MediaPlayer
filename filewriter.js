self.onmessage = async (e)=>{
    console.log(e);
    let data = e.data;
    let name = data[0];
    let arrayBuffer = data[1];
    
    let rootDirHandle = await navigator.storage.getDirectory();
    let fileHandle = await rootDirHandle.getFileHandle(name, { create: true });
    let accessHandle = await fileHandle.createSyncAccessHandle();

    accessHandle.write(arrayBuffer, {at: 0});

    accessHandle.close();
    postMessage("");
}