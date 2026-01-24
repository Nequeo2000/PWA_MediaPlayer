// BEGIN fileSystemAccess API
class FileSystemAccessAPI {
    public static rootDirHandle: FileSystemDirectoryHandle;
    public static quota: number | undefined;
    public static usage: number | undefined;
    public initialized = false;

    constructor() {
        new Promise(async (resolve, reject) => {
            FileSystemAccessAPI.rootDirHandle = await navigator.storage.getDirectory();
            let estimate = await navigator.storage.estimate();
            FileSystemAccessAPI.quota = estimate.quota;
            FileSystemAccessAPI.usage = estimate.usage;
            this.initialized = true;
        });
    }

    async getInfo(): Promise<[quota: number, usage: number]> {
        let estimate = await navigator.storage.estimate();
        FileSystemAccessAPI.quota = estimate.quota;
        FileSystemAccessAPI.usage = estimate.usage;
        return [FileSystemAccessAPI.quota as number, FileSystemAccessAPI.usage as number];
    }

    waitForInitilized(callback: Function) {
        setTimeout(function _() {
            if (FileSystemAccessAPI.rootDirHandle) {
                callback();
            } else {
                setTimeout(_, 500);
            }
        }, 100);
    }

    async getEntries(): Promise<File[] | undefined> {
        let files: File[] = [];
        //let entries !: Iterator<{key: string, value: any}> | null;
        let entries !: Iterator<any> | null;
        if ("entries" in FileSystemAccessAPI.rootDirHandle)
            entries = await (FileSystemAccessAPI.rootDirHandle.entries as Function)();
        if (!entries) {
            console.log("Error in getEntries(): entries == null");
            return;
        }

        let entry = null;
        while ((entry = await entries.next())) {
            if (entry.done)
                return files;
            let fileHandle = entry.value[1];
            let file = await fileHandle.getFile();
            files.push(file);
        }
    }

    async save_file(file: File) {
        let filename = file.name;
        let fileHandle = await FileSystemAccessAPI.rootDirHandle.getFileHandle(filename, { create: true });
        if (fileHandle.createWritable) {
            let fileReadStream = await file.stream();
            let fileHandleWriteStream = await fileHandle.createWritable();
            await fileReadStream.pipeTo(fileHandleWriteStream);
        } else {
            let content = await FileSystemAccessAPI.readAsArrayBuffer(file);
            await new Promise((resolve, reject) => {
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
    }

    static async readAsArrayBuffer(file: File) {
        let arrayBuffer = await new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onloadend = (event: ProgressEvent) => {
                if (event)
                    if (event.target)
                        if ("result" in event.target)
                            resolve(event.target.result);
            };
            fileReader.onerror = (event: ProgressEvent) => {
                console.log("Error in readAsArrayBuffer: fileReader.onerror");
            };
            fileReader.readAsArrayBuffer(file);
        });
        return arrayBuffer;
    }

    async removeEntry(name: string) {
        await FileSystemAccessAPI.rootDirHandle.removeEntry(name);
    }
}
// END fileSystemAccess API