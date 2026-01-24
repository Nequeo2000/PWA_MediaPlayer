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
self.addEventListener("message", (e) => __awaiter(void 0, void 0, void 0, function* () {
    //postMessage("WORKER");
    let data = e.data;
    let name = data[0];
    let arrayBuffer = data[1];
    let rootDirHandle = yield navigator.storage.getDirectory();
    let fileHandle = yield rootDirHandle.getFileHandle(name, { create: true });
    let accessHandle;
    if ("createSyncAccessHandle" in fileHandle)
        accessHandle = yield fileHandle.createSyncAccessHandle();
    let writeSize;
    if (accessHandle)
        writeSize = accessHandle.write(arrayBuffer, { "at": 0 });
    //accessHandle.truncate(writeSize);
    accessHandle.close();
    postMessage("");
}));
