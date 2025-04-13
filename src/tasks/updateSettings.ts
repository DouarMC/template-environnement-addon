import https from "https";
import fs from "fs";
import path from "path";

export function updateSettingsTask(): () => void {
    return () => {
        const fileUrl = "https://raw.githubusercontent.com/DouarMC/template-environnement-addon/master/.vscode/settings.json";
        const outputFilePath = path.join(__dirname, '../../.vscode/settings.json');
        https.get(fileUrl, (response) => {
            const fileStream = fs.createWriteStream(outputFilePath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                console.log("The settings.json file has been downloaded and saved!");
            });
        }).on('error', (error) => {
            console.error(`Error downloading the file: ${error}`);
        })
    }
}