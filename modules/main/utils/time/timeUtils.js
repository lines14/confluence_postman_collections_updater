import moment from 'moment';
import JSONLoader from '../data/JSONLoader.js';

class TimeUtils {
  static today() {
    return moment().format(JSONLoader.config.datesFormat);
  }
}

export default TimeUtils;
