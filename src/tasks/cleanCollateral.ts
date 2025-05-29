import fs from 'fs';
import path from 'path';
import {rimraf} from 'rimraf';
import { getOrThrowFromProcess } from '../getOrThrowFromProcess';

/**
 * Chemins de fichiers et de répertoires à nettoyer pour les packs de comportement, les packs de ressources et les packs de skins dans Minecraft Bedrock Edition.
 */
const MINECRAFT_STABLE_CLEAN_PATHS: Record<string, string[]> = {
    addon: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/PROJECT_NAME',
        'LOCALAPPDATA/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs/PROJECT_NAME'
    ],
    skin_pack: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/skin_packs/PROJECT_NAME'
    ],
    world_template: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/world_templates/PROJECT_NAME'
    ]
}

/**
 * Chemins de fichiers et de répertoires à nettoyer pour les packs de comportement, les packs de ressources et les packs de skins dans Minecraft Preview.
 */
const MINECRAFT_PREVIEW_CLEAN_PATHS: Record<string, string[]> = {
    addon: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/PROJECT_NAME',
        'LOCALAPPDATA/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs/PROJECT_NAME'
    ],
    skin_pack: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/skin_packs/PROJECT_NAME'
    ],
    world_template: [
        'LOCALAPPDATA/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/world_templates/PROJECT_NAME'
    ]
}

/**
 * Fonction nettoyant les chemins de fichiers et de répertoires pour les packs de comportement, les packs de ressources et les packs de skins dans Minecraft Bedrock Edition.
 * @returns 
 */
export function cleanCollateralTask(): () => void {
    return () => {
        const projectName = getOrThrowFromProcess('PROJECT_NAME');
        const projectType = getOrThrowFromProcess('PROJECT_TYPE');
        const minecraftProduct = getOrThrowFromProcess('MINECRAFT_PRODUCT');
        const errorToken = '$ERROR_TOKEN$';
        let appData = process.env.APPDATA;
        if (!appData) {
            console.warn('Proceeding without APPDATA on this platform. File copy will fail if APPDATA is required.');
            appData = errorToken;
        }
        let localAppData = process.env.LOCALAPPDATA;
        if (!localAppData) {
            console.warn('Proceeding without LOCALAPPDATA on this platform. File copy will fail if LOCALAPPDATA is required.');
            localAppData = errorToken;
        }
        let pathsToClean: string[] = [];
        switch (minecraftProduct) {
            case 'BedrockUWP':
                pathsToClean = MINECRAFT_STABLE_CLEAN_PATHS[projectType];
                break;
            case 'PreviewUWP':
                pathsToClean = MINECRAFT_PREVIEW_CLEAN_PATHS[projectType];
                break;
            default:
                throw new Error(`Unknown Minecraft product: ${process.env.MINECRAFT_PRODUCT}. Must be one of 'BedrockUWP' or 'PreviewUWP'.`);
        }
        for (const cleanPathRaw of pathsToClean) {
            const cleanPath = cleanPathRaw
                .replace('LOCALAPPDATA', localAppData)
                .replace('APPDATA', appData)
                .replace('PROJECT_NAME', projectName);
            if (cleanPath.includes(errorToken)) {
                console.warn(`Skipping clean of ${cleanPath} on current platform due to APPDATA or LOCALAPPDATA being missing.`);
                continue;
            }
            try {
                const stats = fs.statSync(cleanPath);
                console.log(`Cleaning ${stats.isDirectory() ? 'directory' : 'file'} ${path.resolve(cleanPath)}`);
                rimraf.sync(cleanPath);
            } catch(_) {
                // Si le chemin n'existe pas, on ignore l'erreur
            }
        }
    }
}