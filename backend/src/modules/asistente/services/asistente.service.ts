import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HORUS_ASSISTANT_INSTRUCTIONS } from '../assistant-instructions';
import { ChatAdvisorDto } from '../dtos/chat-advisor.dto';

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function getGeminiAnswer(value: unknown): string | undefined {
  if (!isRecord(value) || !isUnknownArray(value.candidates)) {
    return undefined;
  }
  const candidate = value.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content)) {
    return undefined;
  }
  const parts: unknown = candidate.content.parts;
  if (!isUnknownArray(parts)) {
    return undefined;
  }
  const text = parts.flatMap((part: unknown) =>
    isRecord(part) && typeof part.text === 'string' ? [part.text] : [],
  );
  const answer = text.join('').trim();
  return answer || undefined;
}

@Injectable()
export class AsistenteService {
  private readonly logger = new Logger(AsistenteService.name);

  constructor(private readonly config: ConfigService) {}

  status() {
    const settings = this.getGeminiConfiguration();
    return settings
      ? { configured: true, status: 'ready' as const }
      : { configured: false, status: 'disabled' as const };
  }

  async chat(dto: ChatAdvisorDto) {
    const settings = this.getGeminiConfiguration();
    if (!settings) {
      throw new ServiceUnavailableException(
        'El asistente no está configurado en este entorno.',
      );
    }

    const contents = [
      ...(dto.history ?? []).map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      { role: 'user', parts: [{ text: dto.message }] },
    ];

    let response: Response;
    try {
      response = await fetch(
        `${GEMINI_API_BASE}/${encodeURIComponent(settings.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-goog-api-key': settings.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: HORUS_ASSISTANT_INSTRUCTIONS }],
            },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 700,
            },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: 'no-store',
        },
      );
    } catch (error: unknown) {
      this.logger.warn('The Gemini generateContent request failed.');
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException(
          'El asistente tardó demasiado en responder. Inténtalo nuevamente.',
        );
      }
      throw new BadGatewayException('No fue posible conectar con Gemini.');
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new HttpException(
          'El asistente está recibiendo demasiadas consultas. Inténtalo nuevamente.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if ([401, 403].includes(response.status)) {
        this.logger.error('Gemini rejected the configured API key.');
        throw new ServiceUnavailableException(
          'La clave de Gemini no está autorizada. Revisa la configuración del backend.',
        );
      }
      if (response.status >= 500) {
        throw new ServiceUnavailableException(
          'Gemini no está disponible en este momento.',
        );
      }
      this.logger.warn(
        `Gemini rejected a request with status ${response.status}.`,
      );
      throw new BadGatewayException('Gemini no pudo procesar la consulta.');
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new BadGatewayException('Gemini devolvió una respuesta inválida.');
    }
    const answer = getGeminiAnswer(body);
    if (!answer) {
      throw new BadGatewayException(
        'Gemini no devolvió una respuesta de texto.',
      );
    }

    return {
      answer,
      intent: 'general',
      match_level: 'ninguna' as const,
      needs_clarification: false,
      clarification_question: null,
      abstained: false,
      recommendations: [],
      sources: [],
    };
  }

  private getGeminiConfiguration():
    { apiKey: string; model: string } | undefined {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      return undefined;
    }

    const model =
      this.config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(model)) {
      throw new ServiceUnavailableException(
        'El modelo de Gemini configurado no es válido.',
      );
    }
    return { apiKey, model };
  }
}
