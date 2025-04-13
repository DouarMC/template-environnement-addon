import fs from "fs";
import { exec } from "child_process";

// Convertir exec en promesse pour l'utiliser avec async/await
function execPromise(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error during TypeScript compilation: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
}

export function typescriptTask(hasScripts: boolean): () => void {
    return async () => {
        if (hasScripts === true && fs.readdirSync("addon/scripts").some(file => file.endsWith('.ts'))) {
            const command = `tsc --project tsconfig.json`;  // Utilise ton fichier tsconfig.json
            try {
                await execPromise(command); // Attendre que la compilation soit terminée
                console.log("TypeScript compilation completed successfully.");
                console.log("A\nA\nA"); // Ce log ne s'affichera qu'après la fin de la compilation
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log("No TypeScript files to compile.");
        }
    };
}