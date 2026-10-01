// creditos Olympio
let fs;
try {
    fs = require('fs-extra');
} catch (_) {
    const nativeFs = require('fs');
    fs = {
        ...nativeFs,
        ensureDirSync: (dir) => { if (!nativeFs.existsSync(dir)) nativeFs.mkdirSync(dir, { recursive: true }); },
        readJSONSync: (p) => JSON.parse(nativeFs.readFileSync(p, 'utf-8')),
        writeJSONSync: (p, d) => nativeFs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8')
    };
}
const path = require('path');
const DB_DIR = path.resolve(__dirname, '../database');
fs.ensureDirSync(DB_DIR);
function matchesQuery(item, query = {}) {
    for (const [key, expected] of Object.entries(query)) {
        const actual = item?.[key];
        if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
            if ('$in' in expected) {
                if (!expected.$in.includes(actual)) return false;
                continue;
            }
        }
        if (actual !== expected) return false;
    }
    return true;
}
class QueryChain {
    constructor(items, ModelClass) {
        this.items = items;
        this.ModelClass = ModelClass;
    }
    sort(sortSpec = {}) {
        const entries = Object.entries(sortSpec);
        if (entries.length === 0) return this;
        this.items.sort((a, b) => {
            for (const [field, direction] of entries) {
                const dir = direction < 0 ? -1 : 1;
                const valueA = a?.[field];
                const valueB = b?.[field];
                if (valueA === valueB) continue;
                if (valueA == null) return 1;
                if (valueB == null) return -1;
                if (valueA > valueB) return dir;
                if (valueA < valueB) return -dir;
            }
            return 0;
        });
        return this;
    }
    limit(count) {
        if (Number.isInteger(count) && count >= 0) {
            this.items = this.items.slice(0, count);
        }
        return this;
    }
    exec() {
        return Promise.resolve(this.items.map(item => new this.ModelClass(item)));
    }
    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }
    catch(reject) {
        return this.exec().catch(reject);
    }
    finally(handler) {
        return this.exec().finally(handler);
    }
}
class JSONDatabase {
    constructor(filename, defaultData = []) {
        this.filepath = path.join(DB_DIR, filename);
        this.defaultData = defaultData;
        if (!fs.existsSync(this.filepath)) {
            this.saveData(this.defaultData);
        }
    }
    loadData() {
        try {
            if (!fs.existsSync(this.filepath)) return this.defaultData;
            return fs.readJSONSync(this.filepath);
        } catch (error) {
            console.error(`Error loading database ${this.filepath}:`, error);
            return this.defaultData;
        }
    }
    saveData(data) {
        try {
            fs.writeJSONSync(this.filepath, data, { spaces: 2 });
        } catch (error) {
            console.error(`Error saving database ${this.filepath}:`, error);
        }
    }
    static model(filename) {
        const db = new JSONDatabase(filename);
        return class Model {
            constructor(data) {
                Object.assign(this, data);
            }
            static async findOne(query = {}) {
                const data = db.loadData();
                const item = data.find(item => matchesQuery(item, query));
                return item ? new this(item) : null;
            }
            static find(query = {}) {
                const data = db.loadData();
                const items = Object.keys(query).length === 0
                    ? data.slice()
                    : data.filter(item => matchesQuery(item, query));
                return new QueryChain(items, this);
            }
            async save() {
                const data = db.loadData();
                let uniqueKey = null;
                if (this.groupId) uniqueKey = 'groupId';
                else if (this.userId) uniqueKey = 'userId';
                else if (this.clanId) uniqueKey = 'clanId';
                else if (this.id) uniqueKey = 'id';
                else if (filename.includes('config')) uniqueKey = null;
                if (uniqueKey) {
                    const index = data.findIndex(item => item[uniqueKey] === this[uniqueKey]);
                    if (index !== -1) {
                        data[index] = { ...data[index], ...this };
                    } else {
                        data.push({ ...this });
                    }
                } else {
                    if (data.length > 0) {
                        data[0] = { ...data[0], ...this };
                    } else {
                        data.push({ ...this });
                    }
                }
                db.saveData(data);
                return this;
            }
        };
    }
}
module.exports = JSONDatabase;
