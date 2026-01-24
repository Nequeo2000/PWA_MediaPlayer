self.addEventListener("message", async (e) => {
    //postMessage("WORKER");
    let data = e.data;
    let name = data[0];
    let arrayBuffer = data[1];
    let rootDirHandle = await navigator.storage.getDirectory();
    let fileHandle = await rootDirHandle.getFileHandle(name, { create: true });
    let accessHandle;
    if ("createSyncAccessHandle" in fileHandle)
        accessHandle = await (fileHandle.createSyncAccessHandle as Function)();

    let writeSize;
    if (accessHandle)
        writeSize = accessHandle.write(arrayBuffer, { "at": 0 });
    //accessHandle.truncate(writeSize);
    accessHandle.close();
    postMessage("");
});