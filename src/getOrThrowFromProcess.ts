/**
 * Fonction qui récupère une variable d'environnement depuis le processus Node.js et lève une erreur si elle n'est pas définie.
 * @param key - Le nom de la variable d'environnement à récupérer.
 * @returns - La valeur de la variable d'environnement.
 * @throws {Error} - Si la variable d'environnement n'est pas définie.
 */
export function getOrThrowFromProcess(key: string): string {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}