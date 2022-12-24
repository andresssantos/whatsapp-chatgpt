const qrcode = require("qrcode-terminal");
const { Client, MessageMedia } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require('openai');

// Environment variables
require("dotenv").config()

const apiKey = process.env.OPENAI_API_KEY

const configuration = new Configuration({
    apiKey: apiKey,
  })
const openai = new OpenAIApi(configuration);

// Prefix check
const text_prefix = '!t'
const image_prefix = '!i'

// Whatsapp Client
const client = new Client()

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
    client.on("message", async (message: any) => {
        message.getChat()
        if (message.body.length == 0) return
        if (message.from == "status@broadcast") return

        if (message.body.toLowerCase().startsWith(text_prefix)) {
            const prompt = message.body.substring(text_prefix.length + 1);
            await handleMessage(message, prompt, text_prefix)
        }else if (message.body.toLowerCase().startsWith(image_prefix)) {
            const prompt = message.body.substring(image_prefix.length + 1);
            await handleMessage(message, prompt, image_prefix)
        }
    })

    client.initialize()
}

const handleMessage = async (message: any, prompt: any, prefix: any) => {
    try {
        var response: any
        const start = Date.now()

        // Send the prompt to the API
        console.log("[Whatsapp ChatGPT] Received imagec prompt from " + message.from + ": " + prompt)

        if(prefix == text_prefix) {
          response = await generateText(prompt)
        }else if(prefix == image_prefix) {
          response = await generateImage(prompt)
        }

        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`)

        const end = Date.now() - start

        console.log("[Whatsapp ChatGPT] ChatGPT took " + end + "ms")

        // Send the response to the chat
        message.reply(response)
    } catch (error: any) {
        message.reply("An error occured, please contact the administrator. (" + error.message + ")")
    }  
}

const generateText = async (prompt : any) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.9,
      top_p: 1.0,
      max_tokens: 1500
    })

    return response.data.choices[0].text

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
}

const generateImage = async (prompt : any) => {
    try {
      const response = await openai.createImage({
        prompt,
        n: 1,
        size: '1024x1024',
      })
  
      const media = await MessageMedia.fromUrl(response.data.data[0].url)

      return media

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
  }

start()
