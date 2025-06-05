import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';

const elevenlabs = new ElevenLabsClient();
const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
  text: 'The first move is what sets everything in motion.',
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128',
});

await play(audio);
