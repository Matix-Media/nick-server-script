import {config} from "dotenv";
import {spawn} from "child_process";
import axios from "axios";
import * as path from "path";

config();

const rootDir: string = process.env.ROOT_DIR;
const ngrokCommand: string = process.env.NGROK_COMMAND;
const ngrokTimeout: number = Number.parseInt(process.env.NGROK_TIMEOUT);
const webhookLink: string = process.env.WEBHOOK_LINK;

let ngrokStarted = false;

function ngrokOutputParse(line: string) {
    console.log(line);

    if (!line.includes("Forwarding")) return;

    for (let part of line.split(" ")) {
        part = part.trim();
        if (part == "" || part == null) continue;
        if (!part.includes("ngrok.io")) continue;

        ngrokStarted = true;
        console.log("Ngrok IP:", part);
        axios.post(webhookLink, {
            embeds: [{
                title: "Neue Minecraft Server Adresse",
                description: "Der Minecraft Server hat eine neue Adresse zugewiesen bekommen.\n\n**IP**: `" + part + "`",
                footer: {
                    text: "Offizieller Freudenhaus SMP Server HD LP xX Bot",
                    icon_url: "https://cdn.discordapp.com/icons/778965930746183691/1585148368fa55f3eff29557bc23d640.webp?size=32"
                }
            }]
        });
    }
}

console.log(`Starting ngrok in "${rootDir}" with command "${ngrokCommand}"`);
const ls = spawn("ngrok", ngrokCommand.split(" "), {cwd: rootDir});
ls.stdout.on("data", ngrokOutputParse);
ls.stderr.on("data", ngrokOutputParse);
ls.on("error", (error) => {
    console.error("An error occurred while starting ngrok proxy:", error)
});
ls.on("close", code => {
    console.warn("Ngrok closed with code:", code);
});


setTimeout(() => {
    if (ngrokStarted) return;

    console.error("Ngrok not started within timeout of", ngrokTimeout, "milliseconds. Closing.")
    try {
        ls.kill();
    } catch (_) {}
}, ngrokTimeout);