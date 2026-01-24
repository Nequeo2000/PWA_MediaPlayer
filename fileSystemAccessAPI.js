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
