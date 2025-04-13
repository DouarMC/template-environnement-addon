import dotenv from 'dotenv';

/**
 * Fonction qui charge les variables d'environnement à partir d'un fichier .env
 * @param envPath - Le chemin vers le fichier .env
 */
export function setupEnvironment(envPath: string): void {
    dotenv.config({path: envPath});
}