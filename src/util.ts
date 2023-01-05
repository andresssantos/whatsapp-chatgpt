export class Util {
    addPunctuation(sentence: string) {
      // Primeira letra maiuscula
      sentence = sentence[0].toLocaleUpperCase() + sentence.slice(1);
      // Verifica se a frase já termina com '?', '!' ou '.'
      if (sentence.endsWith('?') || sentence.endsWith('!') || sentence.endsWith('.')) {
        return sentence;
      } else {
        // Adiciona um ponto final a frase
        return sentence + '.';
      }
    }

    transformToString(documents: any){
      let resultString = '';

      for (const obj of documents) {
        const prompt = obj._source.prompt;
        const completion = obj._source.completion;
        resultString += `${prompt}${completion}`;
      }

      return resultString;
    }
  }