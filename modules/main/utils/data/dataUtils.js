import fs from 'fs';
import path from 'path';
const fileDir = path.join(path.resolve(), './modules/resources/downloads');

class DataUtils {
  static saveToJSON(obj) {
    const [name] = Object.keys(obj);
    const data = obj[name];
    const replacer = (key, value) => (typeof value === 'undefined' ? null : value);
    fs.writeFileSync(`${fileDir}/${name}.json`, JSON.stringify(data, replacer, 4));
  }
}

export default DataUtils;