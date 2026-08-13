import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [folder, projectName, outputFile] = process.argv.slice(2);

if (!folder || !projectName || !outputFile) {
  throw new Error('Usage: node generate-gallery.mjs <image-folder> <project-name> <output-file>');
}

const imageDirectory = path.resolve('redesign/assets/images', folder);
const stems = (await readdir(imageDirectory))
  .filter((file) => file.endsWith('-640.webp'))
  .map((file) => file.replace(/-640\.webp$/, ''))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

const gallery = stems.map((stem, index) => ({
  src: `/redesign/assets/images/${folder}/${stem}-1600.webp`,
  srcset: `/redesign/assets/images/${folder}/${stem}-640.webp 640w, /redesign/assets/images/${folder}/${stem}-960.webp 960w, /redesign/assets/images/${folder}/${stem}-1600.webp 1600w`,
  thumb: `/redesign/assets/images/${folder}/${stem}-640.webp`,
  alt: `${projectName} interior design photograph ${index + 1}`,
}));

await writeFile(path.resolve(outputFile), `window.PROJECT_GALLERY = ${JSON.stringify(gallery, null, 2)};\n`);
