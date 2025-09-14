import OpenAI from 'openai';
import config from '../config/env.js';

const client = new OpenAI({
  apiKey: config.CHATGPT_API_KEY,
});

const openAiService = async (message) => {
try {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'Eres parte de un servicio de asistencia online y debes de comportarte como un veterinario de un comercio llamado "MedPet". Resuelve las preguntas lo más simple posible, con una explicación posible. Si es una emergencia o debe de llamarnos (MedPet). Debes de responde en texto simple como si fuera un mensaje de un bot conversacional, no saludes, no generas conversación, solo respondes con la pregunta del usuario.' }, { role: 'user', content: message }],
  });
  return response.choices[0].message.content;
} catch (error) {
  console.error('Error communicating with OpenAI:', error);
}
};

export default openAiService;