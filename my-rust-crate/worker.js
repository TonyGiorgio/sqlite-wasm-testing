  self.onmessage = (event) => {
    const { type, sql } = event.data; 
    self.postMessage("Got message in worker:" + type + " - " + sql);
  };
/*
import { SQLocalProcessor } from './processor.js';

console.log("new worker processor")
const processor = new SQLocalProcessor();
console.log("setting onmessage")
self.onmessage = (message) => processor.postMessage(message);
console.log("posting message")
processor.onmessage = (message) => self.postMessage(message);
*/
