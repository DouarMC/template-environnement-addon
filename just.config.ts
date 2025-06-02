import fs from 'fs';
import path from 'path';

import { task, series } from "just-scripts";
import { setupEnvironment } from "./src/setupEnvironment";
import { getOrThrowFromProcess } from "./src/getOrThrowFromProcess";
import { cleanTask } from "./src/tasks/clean";
import { cleanCollateralTask } from "./src/tasks/cleanCollateral";
import { createContentsFileTask } from "./src/tasks/createContentsFile";
import { copyTask, CopyTaskParameters } from "./src/tasks/copy";
import { watchTask } from './src/tasks/watch';
import { mcaddonTask, ZipTaskParameters } from "./src/tasks/zip";
import { updateSettingsTask } from "./src/tasks/updateSettings";
import { typescriptTask } from './src/tasks/typescipt';
import { texturesListTask } from "./src/tasks/texturesList";

setupEnvironment('.env'); // Charger les variables d'environnement à partir du fichier .env
const projectType = getOrThrowFromProcess('PROJECT_TYPE'); // Obtenir le type de projet à partir des variables d'environnement
const projectName = getOrThrowFromProcess('PROJECT_NAME'); // Obtenir le nom du projet à partir des variables d'environnement

let copyTaskOptions: CopyTaskParameters;
let mcaddonTaskOptions: ZipTaskParameters;

switch (projectType) {
    case 'addon' :
        if (fs.existsSync("addon") === false) {
            throw new Error("Addon folder does not exist. Please create an addon folder and try again.");
        }
        if (fs.existsSync("addon/behavior_pack") === false && fs.existsSync("addon/resource_pack") === false) {
            throw new Error("Behavior pack or resource pack folder does not exist. Please create a behavior pack or resource pack folder and try again.");
        }

        const addonPacksPath: string[] = [];
        let hasBehaviorPack = false;
        let hasResourcePack = false;
        if (fs.existsSync("addon/behavior_pack")) {
            hasBehaviorPack = true;
            addonPacksPath.push(`addon/behavior_pack/${projectName}`);
        }
        if (fs.existsSync("addon/resource_pack")) {
            hasResourcePack = true;
            addonPacksPath.push(`addon/resource_pack/${projectName}`);
        }
        if (hasBehaviorPack === true && fs.existsSync(`addon/behavior_pack/${projectName}`) === false) {
            throw new Error(`There is no behavior pack folder in the 'behavior_pack' directory. Please create a behavior pack folder and try again.`);
        }
        if (hasResourcePack === true && fs.existsSync(`addon/resource_pack/${projectName}`) === false) {
            throw new Error(`There is no resource pack folder in the 'resource_pack' directory. Please create a resource pack folder and try again.`);
        }
        if (hasBehaviorPack === true && fs.existsSync(`addon/behavior_pack/${projectName}/manifest.json`) === false) {
            throw new Error(`Manifest file does not exist. Please create a manifest file and try again.`);
        }
        if (hasResourcePack === true && fs.existsSync(`addon/resource_pack/${projectName}/manifest.json`) === false) {
            throw new Error(`Manifest file does not exist. Please create a manifest file and try again.`);
        }

        let hasScripts = false;
        if (hasBehaviorPack === true && fs.existsSync(`addon/scripts`)) {
            hasScripts = true;
        }

        copyTaskOptions = {
            addon: {
                copyToBehaviorPacks: hasBehaviorPack ? path.join(__dirname, `./addon/behavior_pack/${projectName}`) : undefined,
                copyToResourcePacks: hasResourcePack ? path.join(__dirname, `./addon/resource_pack/${projectName}`) : undefined,
                copyToScripts: hasScripts ? path.join(__dirname, `./addon/dist/scripts`) : undefined,
            }
        }

        mcaddonTaskOptions = {
            ...copyTaskOptions,
            outputFile: `./addon/dist/packages/${projectName}.mcaddon`
        };

        task("clean-local", cleanTask(["addon/dist"]));
        task("clean-collateral", cleanCollateralTask());
        task("create-contents-file", createContentsFileTask(addonPacksPath));
        task("textures-list", texturesListTask(hasResourcePack));
        
        task("typescript", typescriptTask(hasScripts));
        task("copyArtifacts", copyTask(copyTaskOptions));
        task("package", series("clean-collateral", "create-contents-file", "textures-list", "copyArtifacts"));
        task(
            "local-deploy",
            watchTask(
                [
                    "addon/scripts/**/*.ts",
                    "addon/behavior_pack/**/*.{json,png,lang,mcfunction,mcstructure,nbt}",
                    "addon/resource_pack/**/*.{json,png,lang,material,fsb,ogg,wav,jpeg,jpg,tga}",
                    "!(addon/behavior_pack/*/contents.json)",
                    "!(addon/resource_pack/*/contents.json)",
                    "!(addon/resource_pack/*/textures/textures_list.json)"
                ],
                series("clean-local", "typescript", "package")
            )
        );
        task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
        task("mcaddon", series("clean-local", "typescript", "create-contents-file", "textures-list", "createMcaddonFile"));
        
        break;
    case 'skin_pack' :
        if (fs.existsSync("skin_pack") === false) {
            throw new Error("Skin pack folder does not exist. Please create a skin pack folder and try again.");
        }
        let skinPackPath: string;
        if (fs.existsSync(`skin_pack/${projectName}`) === false) {
            throw new Error(`There is no skin pack folder in the 'skin_pack' directory. Please create a skin pack folder and try again.`);
        }
        skinPackPath = `skin_pack/${projectName}`;
        if (fs.existsSync(`skin_pack/${projectName}/manifest.json`) === false) {
            throw new Error(`Manifest file does not exist. Please create a manifest file and try again.`);
        }

        task("clean-local", cleanTask(["skin_pack/dist"]));
        task("clean-collateral", cleanCollateralTask());
        copyTaskOptions = {
            skin_pack: {
                copyToSkinPacks: path.join(__dirname, `./skin_pack/${projectName}`)
            }
        };
        task("create-contents-file", createContentsFileTask([skinPackPath]));
        task("copyArtifacts", copyTask(copyTaskOptions));
        task("package", series("clean-collateral", "create-contents-file", "copyArtifacts"));
        task(
            "local-deploy",
            watchTask(
                [
                    "skin_pack/**/*.{json,png,lang}"
                ],
                series("clean-local", "package")
            )
        )
        mcaddonTaskOptions = {
            ...copyTaskOptions,
            outputFile: `./skin_pack/dist/packages/${projectName}`
        };
        task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
        task("mcaddon", series("clean-local", "create-contents-file", "createMcaddonFile"));
        break;
    case 'world_template' :
        if (fs.existsSync("world_template") === false) {
            throw new Error("World template folder does not exist. Please create a world template folder and try again.");
        }
        let worldTemplatePath: string;
        if (fs.existsSync(`world_template/${projectName}`) === false) {
            throw new Error(`There is no world template folder in the 'world_template' directory. Please create a world template folder and try again.`);
        }
        worldTemplatePath = `world_template/${projectName}`;
        if (fs.existsSync(`world_template/${projectName}/manifest.json`) === false) {
            throw new Error(`Manifest file does not exist. Please create a manifest file and try again.`);
        }

        task("clean-local", cleanTask(["world_template/dist"]));
        task("clean-collateral", cleanCollateralTask());
        copyTaskOptions = {
            world_template: {
                copyToWorldTemplates: path.join(__dirname, `./world_template/${projectName}`)
            }
        };
        task("create-contents-file", createContentsFileTask([worldTemplatePath]));
        task("copyArtifacts", copyTask(copyTaskOptions));
        task("package", series("clean-collateral", "create-contents-file", "copyArtifacts"));
        task(
            "local-deploy",
            watchTask(
                [
                    "world_template/**/*.{json,png,lang,dat,txt,dat_old,jpg,jpeg,mcfunction,mcstructure,nbt,material,fsb,ogg,wav,jpeg,jpg,tga}"
                ],
                series("clean-local", "package")
            )
        );
        mcaddonTaskOptions = {
            ...copyTaskOptions,
            outputFile: `./world_template/dist/packages/${projectName}`
        };
        task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
        task("mcaddon", series("clean-local", "create-contents-file", "createMcaddonFile"));
        break;
    default : 
        throw new Error(`Unknown project type: ${projectType}. Must be one of 'addon', 'skin_pack', or 'world_template'.`);
}

task('update-settings', updateSettingsTask());