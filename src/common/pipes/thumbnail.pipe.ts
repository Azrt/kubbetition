import { Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs';

@Injectable()
export class ThumbnailPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  async transform(image: Express.Multer.File): Promise<string> {
    const originalImage = path.parse(image.originalname);
    const filename = 'thumbnail-' + originalImage.name + originalImage.ext;

    if (!fs.existsSync('./uploads')) {
      // check if directory exists. Do so synchronously.
      fs.mkdirSync('./uploads');
    }

    const filePath = path.join('uploads', filename);

    await sharp(image.buffer).resize(150).png().toFile(filePath);

    return filePath;
  }
}
