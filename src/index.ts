const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

import { Util } from './util';
import { OpenAI } from './openai';
import { ConversationHistory } from './conversation-history';

const util = new Util()
const openai = new OpenAI();
const conversationHistory = new ConversationHistory()

const intro = "Muito prazer, meu nome é Jarvis. Eu sou um assistente virtual muito inteligente. Se você me fizer uma pergunta que esteja enraizada na verdade, eu lhe darei a resposta. Se você me fizer uma pergunta sem sentido, enganosa ou sem resposta clara, talvez eu não consiga responder.\n\n"
const broadcast_status = "status@broadcast"
const response_unavailable = "Desculpe, não entendi o que você quer dizer. Pode reformular a pergunta?"

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
    if (message.from == broadcast_status) return

    try {
      const body = message.body.toString();
      const firstSpaceIndex = body.indexOf(' ');
      const prefix = body.substring(0, firstSpaceIndex);

      const commandFunction = openai.prefixFunctions[prefix];
      
      if(commandFunction) {
        const prompt = util.addPunctuation(body.substring(firstSpaceIndex + 1));
      
        console.log(`[Whatsapp ChatGPT] Received prompt from ${message._data.notifyName}: ${prompt}`);
        
        const embeddingVector = await openai.createEmbeddingVector(prompt)
        const history = await conversationHistory.getByChatId(message._data.id.remote, embeddingVector)

        console.log(`[Whatsapp ChatGPT] Prompt about to be sent:\n${intro}${history}${prompt}`)

        const start = Date.now();  
        response = commandFunction == openai.handleImageCommand ?
           await commandFunction(prompt) :
           await commandFunction(intro + history + prompt);
        const end = Date.now();
  
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`);
        console.log(`[Whatsapp ChatGPT] Time elapsed: ${(end - start) / 1000} seconds`);

        if(!response.mimetype && !response.error) {
          await conversationHistory.save(message._data.id.remote, message.timestamp, prompt, response, embeddingVector)
        }

        if(typeof response !== 'undefined' && response !== '' && response.error == undefined) {
          message.reply(response);
        } else {
          message.reply(response_unavailable);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  client.initialize()
}

start()