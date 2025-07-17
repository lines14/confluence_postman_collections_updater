import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import TimeUtils from '../time/timeUtils.js';
import JSONLoader from '../data/JSONLoader.js';

class ImageUtils {
  static getCanvas() {
    return createCanvas(...Object.values(JSONLoader.config.canvasDimensions));
  }

  static generateDateImage() {
    const canvas = this.getCanvas();
    const todayDate = TimeUtils.today();
    const {
      bgColor,
      font,
      fontBold,
      textColorBlack,
      textColorRed,
      horizontalPadding,
      verticalPadding,
    } = JSONLoader.config.canvasContext;
    const canvasContext = canvas.getContext('2d');
    const textPrefix = JSONLoader.config.imageTextPrefix;

    canvasContext.fillStyle = bgColor;
    canvasContext.fillRect(0, 0, ...Object.values(JSONLoader.config.canvasDimensions));
    canvasContext.font = font;
    const prefixWidth = canvasContext.measureText(textPrefix).width;
    canvasContext.fillStyle = textColorBlack;
    canvasContext.fillText(textPrefix, horizontalPadding, verticalPadding);
    canvasContext.font = fontBold;
    canvasContext.fillStyle = textColorRed;
    canvasContext.fillText(todayDate, horizontalPadding + prefixWidth, verticalPadding);

    const folderName = 'artifacts';
    const buffer = canvas.toBuffer('image/png');
    fs.mkdirSync(folderName, { recursive: true });
    const filepath = path.join(folderName, 'updateDate.png');
    fs.writeFileSync(filepath, buffer);
  }
}

export default ImageUtils;
