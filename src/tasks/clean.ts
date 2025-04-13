import path from 'path';
import fs from 'fs';
import {rimraf} from 'rimraf';

/**
 * Fonction qui nettoie les répertoires spécifiés en supprimant leur contenu.
 * @param dirs - Un tableau de chaînes représentant les chemins des répertoires à nettoyer.
 * @returns
 */
export function cleanTask(dirs: string[]): () => Promise<void> {
    return async () => {
        for (const dir of dirs) {
            if (fs.existsSync(dir)) {
                console.log(`Cleaning directory: ${dir}`);
                await rimraf(path.resolve(process.cwd(), dir));
            }
        }
    }
}