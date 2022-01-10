import {config} from "dotenv";
import {spawn} from "child_process";
import axios from "axios";
import * as path from "path";
import * as ngrok from "ngrok";

config();

const rootDir: string = process.env.ROOT_DIR;
const webhookLink: string = process.env.WEBHOOK_LINK;
const serverPort: number = Number.parseInt(process.env.SERVER_PORT);

(async () => {
    const url = await ngrok.connect({proto: "tcp", addr: serverPort});

    console.log("Ngrok IP:", url);
    axios.post(webhookLink, {
        embeds: [{
            title: "Neue Minecraft Server Adresse",
            description: "Der Minecraft Server hat eine neue Adresse zugewiesen bekommen.\n\n**IP**: `" + url + "`",
            footer: {
                text: "Offizieller Freudenhaus SMP Server HD LP xX Bot",
                icon_url: "https://cdn.discordapp.com/icons/778965930746183691/1585148368fa55f3eff29557bc23d640.webp?size=32"
            }
        }]
    });
})();

