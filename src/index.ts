const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const delay = require('delay');

import { Util } from './util';
import { CommandHandler } from './command-handler';
import { ConversationHistory } from './conversation-history';

const util = new Util()
const commandHandler = new CommandHandler();
const conversationHistory = new ConversationHistory();
const BROADCAST_STATUS = "status@broadcast"
const RESPONSE_UNAVAILABLE = "Desculpe, não entendi o que você quer dizer. Pode reformular a pergunta?"

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
    if (message.from == BROADCAST_STATUS) return
    
    const prefix = message.body.toString().split(' ')[0];
    const prompt = util.addPunctuation(message.body.substring(prefix.length + 1));

    try {
      const commandFunction = commandHandler.prefixFunctions[prefix];
      
      if(commandFunction) {
        console.log(`[Whatsapp ChatGPT] Received prompt from ${message._data.notifyName}: ${prompt}`);
        
        // Extract keywords from prompt
        const keywords = await commandHandler.extractKeywords(prompt);

        // Filter history by keywords
        const history = conversationHistory.filterHistoryByKeywords(message._data.id.remote, (keywords.includes('undefined')) ? undefined : keywords)

        const start = Date.now();  
        response = commandFunction == commandHandler.handleImageCommand ?
           await commandFunction(prompt) :
           await commandFunction(history + prompt);
        const end = Date.now();
  
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`);
        console.log(`[Whatsapp ChatGPT] Time elapsed: ${(end - start) / 1000} seconds`);

        if(!response.mimetype) {
          keywords.forEach((keyword: string) => {
            conversationHistory.storeMessage(message._data.id.remote, keyword.trim().toLocaleLowerCase() , prompt, response);
          });
        }              

        if(typeof response !== 'undefined' && response !== '' && response.error == undefined) {
          message.reply(response);
        } else {
          message.reply(RESPONSE_UNAVAILABLE);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  client.initialize()
}

start()
