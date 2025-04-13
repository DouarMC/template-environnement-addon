import fs from 'fs';
import path from 'path';

import { getOrThrowFromProcess } from "../getOrThrowFromProcess";

const VALID_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tga'];

function getTextureFiles(dir: string, baseDir: string, collectedFiles: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            getTextureFiles(fullPath, baseDir, collectedFiles);
        } else if (VALID_IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/'); // Normalize for MC
            collectedFiles.push(relativePath);
        }
    }

    return collectedFiles;
}

export function texturesListTask(hasResourcePack: boolean): () => void {
    return () => {
        if (hasResourcePack === true) {
            const projectName = getOrThrowFromProcess('PROJECT_NAME');
            const texturesPath = `addon/resource_pack/${projectName}/textures`;

            if (fs.existsSync(texturesPath) && fs.statSync(texturesPath).isDirectory()) {
                const textureFiles = getTextureFiles(texturesPath, `addon/resource_pack/${projectName}`);
                const outputPath = path.join(texturesPath, "textures_list.json");
                fs.writeFileSync(outputPath, JSON.stringify(textureFiles, null, 2));
                console.log(`Created textures_list.json with ${textureFiles.length} texture files.`);
            }
        }
    }
}