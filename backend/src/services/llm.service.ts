import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function chatCompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured in .env file');
  }

  try {
    const client = getOpenAIClient();
    if (!client) throw new Error('OpenAI client not initialized');

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content ?? '';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate response from LLM');
  }
}
