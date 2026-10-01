// creditos Olympio
let NodeCache;
try {
    NodeCache = require('node-cache');
} catch (_) {
    NodeCache = class {
        constructor() { this.map = new Map(); }
        get(k) { return this.map.get(k); }
        set(k, v) { this.map.set(k, v); }
        del(k) { this.map.delete(k); }
    };
}
const groupCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
module.exports = groupCache;
