const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const gTTS = require('gtts');
const delay = require('delay');

// Environment variables
require('dotenv').config()

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Whatsapp Client
// Use the saved values
const client = new Client({
  authStrategy: new LocalAuth()
});

const handleTextCommand = async (prompt: any) => {
  try {
    const Response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.9,
      top_p: 1.0,
      max_tokens: 1500
    })

    return Response.data.choices[0].text
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      return error.response.data
    } else {
      console.log(error.message);
      return error.message
    }
  }
};

const handleImageCommand = async (prompt: any) => {
  try {
    const response = await openai.createImage({
      prompt,
      n: 1,
      size: '1024x1024',
    })

    return await MessageMedia.fromUrl(response.data.data[0].url)
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      return error.response.data
    } else {
      console.log(error.message);
      return error.message
    }
  }
};

const handleAudioCommand = async (prompt: any) => {
  var gtts = new gTTS(prompt, 'pt');

  await gtts.save('audio.opus', function (err, result){
      if(err) { throw new Error(err); }
      console.log("Text to speech converted!");
  });

  await delay(2000);
  
  return MessageMedia.fromFilePath('audio.opus')
};

const handleCompletionToAudioCommand = async (prompt: any) => {
  const completion = await handleTextCommand(prompt)
  
  return await handleAudioCommand(completion)
};

const prefixFunctions = {
  '!t': handleTextCommand,
  '!i': handleImageCommand,
  '!a': handleAudioCommand,
  '!tta': handleCompletionToAudioCommand,
};

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
    try {
      let response: any
      const prefix = message.body.toString().split(' ')[0];
      const commandFunction = prefixFunctions[prefix];
      if (commandFunction) {
        const prompt = message.body.substring(prefix.length + 1);
        const start = Date.now()
        console.log("[Whatsapp ChatGPT] Received imagec prompt from " + message.from + ": " + prompt)
        response = await commandFunction(prompt);
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`)
        const end = Date.now()
        console.log(`[Whatsapp ChatGPT] Time elapsed: ${(end - start) / 1000} seconds`)

        message.reply(response)
      }
    } catch (error) {
      console.error(error)
    }
  });  

  client.initialize()
}

start()
