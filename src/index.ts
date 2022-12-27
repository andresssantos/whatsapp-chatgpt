const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

import { Util } from './util';
import { CommandHandler } from './command-handler';
import { ConversationHistory } from './conversation-history';

const util = new Util()
const commandHandler = new CommandHandler();
const conversationHistory = new ConversationHistory();

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
    if (message.from == "status@broadcast") return

    try {
      let response: any;
      let conversationHistoryString = '';
  
      const data = await conversationHistory.readHistory(message._data.id.remote);
      if(data){
        data.map((message: string) => {
          conversationHistoryString += message;
        });
      }
      
      const prefix = message.body.toString().split(' ')[0];
      const commandFunction = commandHandler.prefixFunctions[prefix];

      if (commandFunction) {
        const prompt = util.addPunctuation(message.body.substring(prefix.length + 1));
        const start = Date.now();
  
        console.log("[Whatsapp ChatGPT] Received imagec prompt from " + message._data.notifyName + ": " + prompt);
  
        if(commandFunction == commandHandler.handleImageCommand){
          response = await commandFunction(prompt);  
        } else {
          response = await commandFunction(conversationHistoryString + prompt);
        }
  
        const end = Date.now();
  
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`);
        console.log(`[Whatsapp ChatGPT] Time elapsed: ${(end - start) / 1000} seconds`);
        
        if(response != undefined){
          conversationHistory.storeMessage(message._data.id.remote, prompt, response);
          message.reply(response);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  client.initialize()
}

start()
