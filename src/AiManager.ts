import axios from 'axios';
import { normalizePath } from "obsidian";

class OpenAi {
    public static async getWhisperText(
        blob: Blob,
        fileName: string,
        apiKey: string,
        whisperUrl: string,
        whisperModel: string = 'whisper-1',
        whisperLanguage: string = 'en'
    ): Promise<string> {
        const formData = new FormData();
        formData.append("file", blob, fileName);
        formData.append("model", whisperModel);
        formData.append("language", whisperLanguage);

        const response = await axios.post(
            whisperUrl,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );
        return response.data.text
    }

    public static async getChatResponse(
        messages: string,
        apiKey: string,
        apiUrl: string,
    ): Promise<string> {
        try {
            const response = await axios.post(apiUrl, {
                model: 'gpt-4-1106-preview',
                messages: [
                    {"role": "system", "content": "You are ChatGPT, a large language model trained by OpenAI. Carefully heed the user's instructions. Respond using Markdown."},
                    {"role": "user", "content": messages}
                ],
                max_tokens: 4000,
                temperature: 1,
                top_p: 1,
                presence_penalty: 0,
                frequency_penalty: 0,
                stream: false,
                // Other properties like stop, n, logit_bias, and user could be included if supported in the future
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                }
            });

            if (response.data && response.data.error) {
                throw new Error(JSON.stringify(response.data.error));
            }

            // If axios successfully parsed JSON, it will be available as `response.data`
            return response.data.choices[0].message.content;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle axios-specific error
                console.error('Axios error:', error.message);
            } else {
                // Handle unexpected errors
                console.error('Unexpected error:', error);
            }
            throw error;
        }
    }
}

export class AiManager {
    apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async audioToText(
        blob: Blob,
        fileName: string,
    ): Promise<string> {
        return OpenAi.getWhisperText(blob, fileName, this.apiKey, "https://api.openai.com/v1/audio/transcriptions")
    }

    async singleChat(
        message: string,
    ): Promise<string> {
        return OpenAi.getChatResponse(message, this.apiKey, "https://api.openai.com/v1/chat/completions")
    }
}
