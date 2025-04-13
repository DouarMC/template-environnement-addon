import { FileSystem } from "@rushstack/node-core-library";
import path from "path";
import * as zip_lib from "zip-lib";
import * as just_scripts from "just-scripts";

import { getOrThrowFromProcess } from "../getOrThrowFromProcess";
import { CopyTaskParameters } from "./copy";

export type ZipTaskParameters = CopyTaskParameters & {
    /**
     * Le chemin du fichier de sortie où écrire le fichier zip.
     */
    outputFile: string;
};
export type ZipContent = {
    /**
     * Les contenus à ajouter à l'archive zip.
     */
    contents: (string | undefined)[];
    /**
     * Le chemin relatif à la racine. Si ce chemin est fourni, les contenus seront ajoutés dans ce dossier à l'intérieur du zip.
     */
    targetPath?: string;
};

function addContentsToZip(zipContents: ZipContent[], zip: zip_lib.Zip) {
    for (const content of zipContents) {

        for (const originPath of content.contents) {
            console.log("AAAAaaaaaaaaaaaaAAAAAAAAA", originPath)
            if (!originPath) {
                continue;
            }

            const inputPath = path.resolve(originPath);
            const pathStats = FileSystem.getLinkStatistics(inputPath);
            if (pathStats.isDirectory()) {
                console.log(`Adding folder ${inputPath} to package`);
                zip.addFolder(inputPath, content.targetPath);
            } else {
                const metadataPath = content.targetPath
                    ? path.join(content.targetPath, path.parse(inputPath).base)
                    : undefined;
                console.log(`Adding file ${inputPath} to package`);
                zip.addFile(inputPath, metadataPath);
            }
        }
    }
}

export function zipTask(outputFile: string, zipContents: ZipContent[]): ReturnType<typeof just_scripts.parallel> {
    return async function zip() {
        if (zipContents.length === 0 || !zipContents.some(content => content.contents.length > 0)) {
            process.exitCode = 0;
            return Promise.resolve();
        }

        const zip = new zip_lib.Zip();
        addContentsToZip(zipContents, zip);
        let isSucceeded = true;
        let errorMessage = "";

        try {
            // Compression de l'archive
            await zip.archive(outputFile);
            console.log(`Compressed file created at ${outputFile}`);
        } catch (err) {
            isSucceeded = false;
            errorMessage = `Compressed file failed to be created at ${outputFile}: ${err}`;
            console.error(errorMessage);
        }

        if (isSucceeded) {
            process.exitCode = 0;
            return Promise.resolve();
        }

        process.exitCode = 1;
        return Promise.reject(new Error(errorMessage));
    };
}

export function mcaddonTask(params: ZipTaskParameters): just_scripts.TaskFunction {
    const projectType = getOrThrowFromProcess('PROJECT_TYPE');

    switch (projectType) {
        case "addon": {
            const targetFolder = path.parse(params.outputFile).dir;
            const outputFileName = path.parse(params.outputFile).base;
            const behaviorPackFile = path.join(targetFolder, `${outputFileName}_bp.mcpack`);
            const resourcePackFile = path.join(targetFolder, `${outputFileName}_rp.mcpack`);
        
            const mcaddonContents: { contents: string[] } = {contents: []};
        
            if (params.addon?.copyToBehaviorPacks && params.addon.copyToBehaviorPacks) {
                mcaddonContents.contents.push(behaviorPackFile);
            }
            if (params.addon?.copyToResourcePacks && params.addon.copyToResourcePacks) {
                mcaddonContents.contents.push(resourcePackFile);
            }
        
            just_scripts.task('packBP', zipTask(behaviorPackFile, [
                { contents: [params.addon?.copyToBehaviorPacks]},
                { contents: [params.addon?.copyToScripts], targetPath: 'scripts' }
            ]));
            just_scripts.task('packRP', zipTask(resourcePackFile, [
                { contents: [params.addon?.copyToResourcePacks]}
            ]));
            just_scripts.task('packMcaddon', zipTask(params.outputFile, [mcaddonContents]));
            return just_scripts.series(just_scripts.parallel('packBP', 'packRP'), 'packMcaddon');
        }
        case "skin_pack": {
            const targetFolder = path.parse(params.outputFile).dir;
            const outputFileName = path.parse(params.outputFile).base;
            const skinPackFile = path.join(targetFolder, `${outputFileName}.mcpack`);
            just_scripts.task("packSP", zipTask(skinPackFile, [
                { contents: [params.skin_pack?.copyToSkinPacks] }
            ]))
            return just_scripts.series("packSP");
        }
        case "world_template": {
            const targetFolder = path.parse(params.outputFile).dir;
            const outputFileName = path.parse(params.outputFile).base;
            const worldTemplateFile = path.join(targetFolder, `${outputFileName}.mctemplate`);
            just_scripts.task("packWT", zipTask(worldTemplateFile, [
                { contents: [params.world_template?.copyToWorldTemplates] }
            ]))
            return just_scripts.series("packWT");
        }
        default: {
            throw new Error(`Unknown project type: ${projectType}. Must be one of 'addon', 'skin_pack' or 'world_template'.`);
        }
    }
}