import { FileSystem } from "@rushstack/node-core-library";
import path from "path";

/**
 * Fonction pour copier des fichiers d'un emplacement à un autre.
 * @param originPaths Les chemins d'origine des fichiers ou dossiers à copier.
 * @param outputPath Le chemin de destination où les fichiers ou dossiers seront copiés.
 */
export function copyFiles(originPaths: string[], outputPath: string): void {
    let destinationPath = path.resolve(outputPath);

    for (const originPath of originPaths) {
        const inputPath = path.resolve(originPath);
        console.log(inputPath);
        const pathStats = FileSystem.getLinkStatistics(inputPath);
        if (pathStats.isDirectory()) {
            console.log(`Copying folder ${inputPath} to ${destinationPath}`);
        } else {
            const filename = path.parse(inputPath).base;
            destinationPath = path.resolve(destinationPath, filename);
            console.log(`Copying file ${inputPath} to ${destinationPath}`);
        }

        FileSystem.copyFiles({
            sourcePath: inputPath,
            destinationPath: destinationPath
        })
    }
}