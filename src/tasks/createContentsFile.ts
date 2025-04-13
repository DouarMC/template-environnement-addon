import fs from 'fs';

/**
 * Crée un fichier contents.json pour chaque pack d'addon spécifié dans le tableau addonPacks. Si le fichier existe déjà, il ne sera pas écrasé.
 * @param addonPacks - Un tableau de chaînes représentant les chemins des packs d'addon pour lesquels le fichier contents.json doit être créé.
 * @returns 
 */
export function createContentsFileTask(addonPacks: string[]): () => void {
    return () => {
        for (const pack of addonPacks) {
            const contentsPath = `${pack}/contents.json`;
            if (fs.existsSync(contentsPath) === false) {
                const contents = "{}";
                fs.writeFileSync(contentsPath, contents, { encoding: 'utf8' });
                console.log(`Created ${contentsPath}`);
            }
        }
    }
}