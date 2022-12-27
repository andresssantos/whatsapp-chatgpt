const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

import { Util } from './util';
import { CommandHandler } from './command-handler';
import { ConversationHistory } from './conversation-history';

const util = new Util()
const commandHandler = new CommandHandler();
const conversationHistory = new ConversationHistory();
const BROADCAST_STATUS = "status@broadcast"

conversationHistory.readAllHistory()

// Environment variables
require('dotenv').config()

// Whatsapp Client
const client = new Client({
  authStrategy: new LocalAuth()
});

// Entrypoint
const start = async () => {
  // Whatsapp auth
  client.on("qr", (qr: string) => {
      console.log("[Whatsapp ChatGPT] Scan this QR code in whatsapp to log in:")
      qrcode.generate(qr, { small: true });
  })

  // Whatsapp ready
  client.on("ready", () => {
    console.log("[Whatsapp ChatGPT] Client is ready!");
  })

  // Whatsapp message
  client.on("message_create", async (message: any) => {    
    let response: any;
    let conversationHistoryString = '';
    if (message.from == BROADCAST_STATUS) return

    try {
      const data = await conversationHistory.readHistory(message._data.id.remote);
      if (Array.isArray(data) && data.length > 0) {
        conversationHistoryString = data.reduce((acc: string, message: string) => {
          return acc + message;
        }, '');
      }    
      
      const prefix = message.body.toString().split(' ')[0];
      const commandFunction = commandHandler.prefixFunctions[prefix];

      if (commandFunction) {
        const prompt = util.addPunctuation(message.body.substring(prefix.length + 1));
  
        console.log(`[Whatsapp ChatGPT] Received prompt from ${message._data.notifyName}: ${prompt}`);

        const start = Date.now();  
        response = commandFunction == commandHandler.handleImageCommand ?
           await commandFunction(prompt) :
           await commandFunction(conversationHistoryString + prompt);
        const end = Date.now();
  
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`);
        console.log(`[Whatsapp ChatGPT] Time elapsed: ${(end - start) / 1000} seconds`);
        
        if (typeof response !== 'undefined' && response !== '') {
          conversationHistory.storeMessage(message._data.id.remote, prompt, response);
          message.reply(response);
        } else {
          message.reply("Desculpe, não entendi o que você quer dizer.");
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  client.initialize()
}

start()
