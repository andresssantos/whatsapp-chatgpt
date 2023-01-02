export class Util {
    addPunctuation(sentence: string) {
      // Verifica se a frase já termina com '?', '!' ou '.'
      if (sentence.endsWith('?') || sentence.endsWith('!') || sentence.endsWith('.')) {
        return sentence;
      } else {
        // Adiciona um ponto final a frase
        return sentence + '.';
      }
    }
  }