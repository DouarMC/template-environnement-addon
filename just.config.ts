import { argv, parallel, series, task, tscTask } from "just-scripts";
import {
  BundleTaskParameters,
  CopyTaskParameters,
  bundleTask,
  cleanTask,
  cleanCollateralTask,
  copyTask,
  coreLint,
  mcaddonTask,
  setupEnvironment,
  ZipTaskParameters,
  STANDARD_CLEAN_PATHS,
  DEFAULT_CLEAN_DIRECTORIES,
  getOrThrowFromProcess,
  watchTask
} from "@douarmc/core-build-tasks";
import path from "path";
import fs from "fs";
import https from "https";

setupEnvironment(path.resolve(__dirname, ".env")); // Charge les variables d'environnement du fichier .env

const projectName = getOrThrowFromProcess("PROJECT_NAME"); // Récupère le nom du projet depuis les variables d'environnement

// Paramètres des tâches de bundle pour le script.
const bundleTaskOptions: BundleTaskParameters = {
  entryPoint: path.join(__dirname, "./scripts/main.ts"), // Fichier d'entrée du script.
  external: ["@minecraft/server", "@minecraft/server-ui"], // Dépendances externes du script.
  outfile: path.resolve(__dirname, "./dist/scripts/main.js"), // Fichier de sortie du script en JavaScript.
  minifyWhitespace: false, // Minifie le code en retirant les espaces inutiles.
  sourcemap: true, // Génère un fichier de source map pour le script.
  outputSourcemapPath: path.resolve(__dirname, "./dist/debug"), // Chemin de sortie du fichier de source map.
};

/**
 * Fonction pour vérifier si un répertoire existe et contient du contenu.
 * @param directory Le répertoire à vérifier.
 * @returns 
 */
function hasDirectory(directory: string): boolean {
  return fs.existsSync(directory) && fs.readdirSync(directory).length > 0;
};

/**
 * Vérifie si un répertoire contient des fichiers TypeScript.
 * @param directory Le répertoire à vérifier.
 * @returns 
 */
function hasTypeScriptFiles(directory: string): boolean {
  return fs.existsSync(directory) && fs.readdirSync(directory).some(file => file.endsWith('.ts'));
};

// Paramètres des tâches de copie des packs.
const copyTaskOptions: CopyTaskParameters = {
  copyToBehaviorPacks: hasDirectory(`./behavior_packs/${projectName}`) ? [`./behavior_packs/${projectName}`] : [],
  copyToScripts: hasTypeScriptFiles(path.resolve(__dirname, "scripts")) ? ["./dist/scripts"] : [],
  copyToResourcePacks: hasDirectory(`./resource_packs/${projectName}`) ? [`./resource_packs/${projectName}`] : [],
};

// Paramètres des tâches de création de fichier mcaddon.
const mcaddonTaskOptions: ZipTaskParameters = {
  ...copyTaskOptions, // Copie les options de copie.
  outputFile: `./dist/packages/${projectName}.mcaddon`, // Chemin de sortie du fichier mcaddon.
};

// Vérifie si le répertoire de scripts contient des fichiers TypeScript.
if (hasTypeScriptFiles(path.resolve(__dirname, "scripts"))) {
  task("typescript", tscTask()); // Tâche de compilation des fichiers TypeScript.
  task("bundle", bundleTask(bundleTaskOptions)); // Tâche de bundle du script.
  task("build", series("typescript", "bundle")); // Tâche de build du projet (compilation + bundle).
} else {
  task("build", () => console.log("No TypeScript files found in the scripts directory.")); // Tâche de build du projet (aucun fichier TypeScript trouvé).
}


task("lint", coreLint(["scripts/**/*.ts"], argv().fix));
task("clean-local", cleanTask(DEFAULT_CLEAN_DIRECTORIES));
task("clean-collateral", cleanCollateralTask(STANDARD_CLEAN_PATHS));
task("clean", parallel("clean-local", "clean-collateral"));
task("copyArtifacts", copyTask(copyTaskOptions));
task("package", series("clean-collateral", "copyArtifacts"));
task(
  "local-deploy",
  watchTask(
    ["scripts/**/*.ts", "behavior_packs/**/*.{json,lang,tga,ogg,png}", "resource_packs/**/*.{json,lang,tga,ogg,png}"],
    series("clean-local", "build", "package")
  )
);
task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
task("mcaddon", series("clean-local", "build", "createMcaddonFile"));

// Tâche pour mettre à jour le fichier settings.json pour les schémas de validation.
task('update-settings', () => {
  // URL brute du fichier settings.json sur GitHub
  const fileUrl = 'https://raw.githubusercontent.com/DouarMC/template-environnement-addon/master/.vscode/settings.json';

  // Chemin local pour enregistrer le fichier téléchargé
  const outputFilePath = path.join(__dirname, './.vscode/settings.json');

  // Télécharger et enregistrer le fichier
  https.get(fileUrl, (response) => {
    const fileStream = fs.createWriteStream(outputFilePath);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log('Le fichier settings.json a été téléchargé avec succès!');
    });
  }).on('error', (error) => {
    console.error('Erreur lors du téléchargement du fichier:', error);
  });
});

