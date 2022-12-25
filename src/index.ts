const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const gTTS = require('gtts');
const delay = require('delay');

// Environment variables
require('dotenv').config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Prefix check
const text_prefix = '!t'
const image_prefix = '!i'
const audio_prefix = '!a'
const completion_to_audio_prefix = '!tta'

// Whatsapp Client
// Use the saved values
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
        // if(message.hasMedia){
        //     const media = await message.downloadMedia();
        //     const imageName = message._data.mediaKey.replace('/', '')

        //     let base64String = media.data
        //     let base64Image = base64String.split(';base64,').pop();
        //     try {
        //       await fs.writeFileSync(imageName.concat('.jpeg'), base64Image, {encoding: 'base64'}, function() {
        //         console.log('File ' + imageName.concat('.jpeg') + ' created');
        //       });
        //     }catch(error) {
        //       console.log(error);
        //     }
        // }


        if (message.body.toString().split(' ')[0] == text_prefix) {
          console.log('ENTREI NO text_prefix')
            const prompt = message.body.substring(text_prefix.length + 1);
            await handleMessage(message, prompt, text_prefix)
        }else if (message.body.toString().split(' ')[0] == image_prefix) {
          console.log('ENTREI NO image_prefix')
            const prompt = message.body.substring(image_prefix.length + 1);
            await handleMessage(message, prompt, image_prefix)
        }else if (message.body.toString().split(' ')[0] == audio_prefix) {
          console.log('ENTREI NO audio_prefix')
          const prompt = message.body.substring(audio_prefix.length + 1);
          await handleMessage(message, prompt, audio_prefix)
        }else if (message.body.toString().split(' ')[0] == completion_to_audio_prefix) {
          console.log('ENTREI NO completion_to_audio_prefix')
          const prompt = message.body.substring(completion_to_audio_prefix.length + 1);
          await handleMessage(message, prompt, completion_to_audio_prefix)
        }
    })

    // client.on('message_revoke_everyone', async (after, before) => {
    //     // Fired whenever a message is deleted by anyone (including you)
    //     const text = 'Mensagem apagada de ' + before._data.notifyName + ' com o conteúdo:'

    //     try {
    //       if (before && !before.fromMe) {
    //         if(before.hasMedia){
    //           const revoked_media = await MessageMedia.fromFilePath(before._data.mediaKey.replace('/', '').concat('.jpeg'))
  
    //           client.sendMessage(before.from, revoked_media, { caption: text });
    //         }else{
    //           client.sendMessage(before.from, text.concat('\n\n').concat(before.body.toString()))
    //         }
    //       }
    //     }catch(error) {
    //       console.log(error);
    //     }
    // });

    client.initialize()
}

const handleMessage = async (message: any, prompt: any, prefix: any) => {
    try {
        var response: any

        const start = Date.now()
        // Send the prompt to the API
        console.log("[Whatsapp ChatGPT] Received imagec prompt from " + message.from + ": " + prompt)

        if(prefix === text_prefix) {
          console.log('ENTREI NO text_prefix')
          response = await generateText(prompt)
        }else if(prefix === image_prefix) {
          console.log('ENTREI NO image_prefix')
          response = await generateImage(prompt)
        }else if(prefix === audio_prefix) {
          console.log('ENTREI NO audio_prefix')
          response = await generateAudio(prompt)
        }else if(prefix === completion_to_audio_prefix) {
          console.log('ENTREI NO completion_to_audio_prefix')
          const completion = await generateText(prompt)
          response = await generateAudio(completion)
        }
        
        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response}`)

        const end = Date.now() - start
        console.log("[Whatsapp ChatGPT] ChatGPT took " + end + "ms")

        // Send the response to the chat
        message.reply(response)
    } catch (error: any) {
        console.log(error)
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

const generateAudio = async (prompt : any) => {
  var gtts = new gTTS(prompt, 'pt');

  await gtts.save('audio.opus', function (err, result){
      if(err) { throw new Error(err); }
      console.log("Text to speech converted!");
  });

  await delay(2000);
  
  return MessageMedia.fromFilePath('audio.opus')
}

start()
