import {config} from "dotenv";
import {spawn} from "child_process";
import axios from "axios";
import * as path from "path";
import * as ngrok from "ngrok";

config();

const rootDir: string = process.env.ROOT_DIR;
const ipWebhookLink: string = process.env.IP_WEBHOOK_LINK;
const chatWebhookLink: string = process.env.CHAT_WEBHOOK_LINK;
const serverPort: number = Number.parseInt(process.env.SERVER_PORT);

function startMinecraftServer(onChat = (username:string, message:string) => {}, onClose = (code: number) => {}): Promise<void> {
    return new Promise<void>((resolve) => {
        const sp = spawn("start.bat", {cwd: rootDir});
        sp.stdout.on("data", (buffer: Buffer) => {
            const line = buffer.toString("utf-8");

            const chatCheck = line.match(/\s<(.*)>\s(.*)/);
            if (chatCheck) 
                onChat(chatCheck[1].replace(/[\&§]./g, ''), chatCheck[2].replace(/[\&§]./g, ''));
            
            if (!line.includes("[Server thread/INFO]: Done") && !line.includes("! For help, type \"help\"")) return;
            resolve();
        });

        sp.on("close", (code) => {
            onClose(code);
        })
    });
}

(async () => {
    let url: string;
    
    console.log("Starting Minecraft server...");
    await startMinecraftServer(async (username, message) => {
        console.log(`[Chat] ${username}: ${message}`);
        const uuid: any = (await axios.get("https://api.mojang.com/users/profiles/minecraft/" + username)).data;
        const iconUrl = "https://crafatar.com/avatars/" + uuid.id;

        await axios.post(chatWebhookLink, {
            content: message,
            username: username,
            avatar_url: iconUrl,
        })
    }, async (code) => {
        console.error("Minecraft server stopped with code", code);
        await ngrok.disconnect(url);
    });
    console.log("Server started successfully");

    url = await ngrok.connect({proto: "tcp", addr: serverPort});

    console.log("Server reachable through:", url.replace("tcp://", ""));

    await axios.post(ipWebhookLink, {
        embeds: [{
            title: "Neue Minecraft Server Adresse",
            description: "Der Minecraft Server hat eine neue Adresse zugewiesen bekommen.\n\n**IP**: `" + url.replace("tcp://", "") + "`",
            footer: {
                text: "Offizieller Freudenhaus SMP Server HD LP xX Bot",
                icon_url: "https://cdn.discordapp.com/icons/778965930746183691/1585148368fa55f3eff29557bc23d640.webp?size=32"
            }
        }]
    });

    
})();

