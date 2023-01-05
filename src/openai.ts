const { MessageMedia } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require('openai');
const gTTS = require('gtts');
const delay = require('delay');

// Environment variables
require('dotenv').config()

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export class OpenAI {

  createEmbeddingVector = async (prompt: any) => {
    try {
      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: prompt,
      });

      return response.data.data
    } catch (error) {
      console.error(error);
    }
  }

  handleTextCommand = async (prompt: any) => {
      try {
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: 1500,
          temperature: 0.9,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.6
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
    };
      
  handleImageCommand = async (prompt: any) => {
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
  
  handleAudioCommand = async (prompt: any) => {
    var gtts = new gTTS(prompt, 'pt');
  
    await gtts.save('audio.opus', function (err, result){
        if(err) { throw new Error(err); }
        console.log("[GTTS] Text to speech converted!");
    });
  
    await delay(2000);
    
    return MessageMedia.fromFilePath('audio.opus')
  };
  
  handleCompletionToAudioCommand = async (prompt: any) => {
    const completion = await this.handleTextCommand(prompt)
    
    return await this.handleAudioCommand(completion)
  };
  
  prefixFunctions = {
    '!t': this.handleTextCommand,
    '!i': this.handleImageCommand,
    '!a': this.handleAudioCommand,
    '!tta': this.handleCompletionToAudioCommand,
  };

}