import { cp, mkdir, rm } from 'node:fs/promises';

const outputDirectory = 'dist';
const staticFiles = ['index.html', 'style.css', 'script.js'];

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of staticFiles) {
  await cp(file, `${outputDirectory}/${file}`);
}

await cp('images', `${outputDirectory}/images`, { recursive: true });
