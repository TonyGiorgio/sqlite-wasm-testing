let nanoid = (size = 21) =>
  crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
    byte &= 63;
    if (byte < 36) {
      id += byte.toString(36);
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase();
    } else if (byte > 62) {
      id += '-';
    } else {
      id += '_';
    }
    return id
  }, '');

class SQLocal {
    constructor(databasePath) {
        Object.defineProperty(this, "databasePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "worker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isWorkerDestroyed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "userCallbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "queriesInProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "processMessageEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                const message = event.data;
                const queries = this.queriesInProgress;
                switch (message.type) {
                    case 'success':
                    case 'data':
                    case 'error':
                        if (message.queryKey && queries.has(message.queryKey)) {
                            const [resolve, reject] = queries.get(message.queryKey);
                            if (message.type === 'error') {
                                reject(message.error);
                            }
                            else {
                                resolve(message);
                            }
                            queries.delete(message.queryKey);
                        }
                        else if (message.type === 'error') {
                            throw message.error;
                        }
                        break;
                    case 'callback':
                        const userCallback = this.userCallbacks.get(message.name);
                        if (userCallback) {
                            userCallback(...(message.args ?? []));
                        }
                        break;
                }
            }
        });
        Object.defineProperty(this, "createQuery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (message) => {
		console.log("called createQuery")
                if (this.isWorkerDestroyed === true) {
                    throw new Error('This SQLocal client has been destroyed. You will need to initialize a new client in order to make further queries.');
                }
		console.log("calling nanoid")
                const queryKey = nanoid();
		console.log("calling postMessage with sql message: ", message.sql);
                this.worker.postMessage({
                    ...message,
                    queryKey,
                });
		console.log("returning promise")
                return new Promise((resolve, reject) => {
		    console.log("setting queriesInProgress")
                    this.queriesInProgress.set(queryKey, [resolve, reject]);
		    console.log("done setting queriesInProgress")
                });
            }
        });
        Object.defineProperty(this, "convertSqlTemplate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (queryTemplate, ...params) => {
		console.log("called convertSqlTemplate")
                return {
                    sql: queryTemplate.join('?'),
                    params,
                };
            }
        });
        Object.defineProperty(this, "convertRowsToObjects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (rows, columns) => {
                return rows.map((row) => {
                    const rowObj = {};
                    columns.forEach((column, columnIndex) => {
                        rowObj[column] = row[columnIndex];
                    });
                    return rowObj;
                });
            }
        });
        Object.defineProperty(this, "exec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (sql, params, method) => {
		console.log("called exec")
                const message = await this.createQuery({
                    type: 'query',
                    sql,
                    params,
                    method,
                });
		console.log("exec called createQuery")
                let data = {
                    rows: [],
                    columns: [],
                };
                if (message.type === 'data') {
                    data.rows = message.rows;
                    data.columns = message.columns;
                }
		console.log("returning exec")
                return data;
            }
        });
        Object.defineProperty(this, "sql", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (queryTemplate, ...params) => {
		console.log("called sql query")
                const statement = this.convertSqlTemplate(queryTemplate, ...params);
                const { rows, columns } = await this.exec(statement.sql, statement.params, 'all');
                return this.convertRowsToObjects(rows, columns);
            }
        });
        Object.defineProperty(this, "transaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (passStatements) => {
                const statements = passStatements(this.convertSqlTemplate);
                await this.createQuery({
                    type: 'transaction',
                    statements,
                });
            }
        });
        Object.defineProperty(this, "createCallbackFunction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (functionName, handler) => {
                await this.createQuery({
                    type: 'function',
                    functionName,
                });
                this.userCallbacks.set(functionName, handler);
            }
        });
        Object.defineProperty(this, "getDatabaseFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                const opfs = await navigator.storage.getDirectory();
                const fileHandle = await opfs.getFileHandle(this.databasePath);
                return await fileHandle.getFile();
            }
        });
        Object.defineProperty(this, "overwriteDatabaseFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (databaseFile) => {
                const opfs = await navigator.storage.getDirectory();
                const fileHandle = await opfs.getFileHandle(this.databasePath, {
                    create: true,
                });
                const fileWritable = await fileHandle.createWritable();
                await fileWritable.truncate(0);
                await fileWritable.write(databaseFile);
                await fileWritable.close();
            }
        });
        Object.defineProperty(this, "destroy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                await this.createQuery({ type: 'destroy' });
                this.worker.removeEventListener('message', this.processMessageEvent);
                this.queriesInProgress.clear();
                this.userCallbacks.clear();
                this.worker.terminate();
                this.isWorkerDestroyed = true;
            }
        });
	    /*
const blob = new Blob([`
  self.onmessage = (event) => {
    const { type, sql } = event.data; 
    self.postMessage("Got message in worker:" + type + " - " + sql);
  };
`], { type: 'text/javascript' });
this.worker = new Worker(URL.createObjectURL(blob));
*/
const blob = new Blob([`
self.postMessage("init worker blob");

// import { SQLocalProcessor } from './processor.js';

console.log("new worker processor")
self.postMessage("Creating new sql local processor");
const processor = new SQLocalProcessor();
self.postMessage("created new sql local processor");
self.onmessage = (message) => processor.postMessage(message);
processor.onmessage = (message) => self.postMessage(message);
`], { type: 'text/javascript' });
this.worker = new Worker(URL.createObjectURL(blob));

	    /*
	console.log("making url with meta url: " + import.meta.url)
        this.worker = new Worker(new URL('../worker', import.meta.url), {
            type: 'module',
        });
	*/
// Listen for messages from the worker.
this.worker.onmessage = (event) => {
  console.log("Received message from the worker:" + event.data);
};
        this.worker.addEventListener('message', this.processMessageEvent);
        this.databasePath = databasePath;
        this.worker.postMessage({
            type: 'config',
            key: 'databasePath',
            value: databasePath,
        });
    }
}

export { SQLocal };
