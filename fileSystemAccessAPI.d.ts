declare let rootDirHandle: any;
declare function initOPFS(): Promise<any[]>;
declare function getInfo(): Promise<(number | undefined)[]>;
declare function getEntries(): Promise<any[] | undefined>;
declare function save_file(file: any): Promise<void>;
declare function readAsArrayBuffer(file: any): Promise<unknown>;
