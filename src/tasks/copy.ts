import path from 'path';

import { getOrThrowFromProcess } from '../getOrThrowFromProcess';
import {copyFiles} from '../copyFiles';

export type MinecraftDeployPaths = {
    addon: {
        behavior_pack: string[];
        resource_pack: string[];
    };
    skin_pack: string[];
    world_template: string[];
}

const LOCALAPPDATA = process.env.LOCALAPPDATA;

/**
 * Les chemins de déploiement pour Minecraft Stable.
 */
const MINECRAFT_STABLE_DEPLOY_PATHS: MinecraftDeployPaths = {
    addon: {
        behavior_pack: [
            `${LOCALAPPDATA}/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs`
        ],
        resource_pack: [
            `${LOCALAPPDATA}/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs`
        ]
    },
    skin_pack: [
        `${LOCALAPPDATA}/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_skin_packs`
    ],
    world_template: [
        `${LOCALAPPDATA}/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/world_templates`
    ]
}

/**
 * Les chemins de déploiement pour Minecraft Preview.
 */
const MINECRAFT_PREVIEW_DEPLOY_PATHS: MinecraftDeployPaths = {
    addon: {
        behavior_pack: [
            `${LOCALAPPDATA}/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs`
        ],
        resource_pack: [
            `${LOCALAPPDATA}/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs`
        ]
    },
    skin_pack: [
        `${LOCALAPPDATA}/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/development_skin_packs`
    ],
    world_template: [
        `${LOCALAPPDATA}/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/world_templates`
    ]
}

export type CopyTaskParameters = {
    addon?: {
        copyToBehaviorPacks?: string;
        copyToResourcePacks?: string;
        copyToScripts?: string;
    };
    skin_pack?: {
        copyToSkinPacks?: string;
    };
    world_template?: {
        copyToWorldTemplates?: string;
    };
}

/**
 * Copie les fichiers de l'addon vers le répertoire de déploiement de Minecraft.
 * @param params Les paramètres de la tâche de copie.
 * @returns 
 */
export function copyTask(params: CopyTaskParameters): () => void {
    return () => {
        const projectType = getOrThrowFromProcess('PROJECT_TYPE');
        const projectName = getOrThrowFromProcess('PROJECT_NAME');
        const minecraftProduct = getOrThrowFromProcess('MINECRAFT_PRODUCT');
        let minecraftDeployPaths: MinecraftDeployPaths;
        switch (minecraftProduct) {
            case 'BedrockUWP':
                minecraftDeployPaths = MINECRAFT_STABLE_DEPLOY_PATHS;
                break;
            case 'PreviewUWP':
                minecraftDeployPaths = MINECRAFT_PREVIEW_DEPLOY_PATHS;
                break;
            default:
                throw new Error(`Unsupported Minecraft product: ${minecraftProduct}`);
        }
        switch (projectType) {
            case 'addon':
                if (params.addon?.copyToBehaviorPacks !== undefined) {
                    copyFiles([params.addon.copyToBehaviorPacks], path.join(minecraftDeployPaths.addon.behavior_pack[0], projectName));
                    if (params.addon.copyToScripts) {
                        copyFiles([params.addon.copyToScripts], path.join(minecraftDeployPaths.addon.behavior_pack[0], projectName, 'scripts'));
                    }
                }
                if (params.addon?.copyToResourcePacks !== undefined) {
                    copyFiles([params.addon.copyToResourcePacks], path.join(minecraftDeployPaths.addon.resource_pack[0], projectName));
                }
                break;
            case 'skin_pack':
                if (params.skin_pack?.copyToSkinPacks !== undefined) {
                    copyFiles([params.skin_pack.copyToSkinPacks], path.join(minecraftDeployPaths.skin_pack[0], projectName));
                }
                break;
            case 'world_template':
                if (params.world_template?.copyToWorldTemplates !== undefined) {
                    copyFiles([params.world_template.copyToWorldTemplates], path.join(minecraftDeployPaths.world_template[0], projectName));
                }
                break;
        }
    }
}