import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsistenteService } from './asistente.service';

describe('AsistenteService', () => {
  const configValues: Record<string, string | undefined> = {};
  const requestOptions: RequestInit[] = [];
  const requestUrls: string[] = [];
  const requestBodies: string[] = [];
  let service: AsistenteService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    requestOptions.length = 0;
    requestUrls.length = 0;
    requestBodies.length = 0;
    delete configValues.GEMINI_API_KEY;
    delete configValues.GEMINI_MODEL;
    const config = {
      get: (name: string) => configValues[name],
    };
    service = new AsistenteService(config as ConfigService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('reports the assistant disabled if the Gemini API key is missing', async () => {
    expect(service.status()).toEqual({
      configured: false,
      status: 'disabled',
    });
    await expect(
      service.chat({ message: 'Consulta', history: [] }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls Gemini from the backend and maps conversation history to its API contract', async () => {
    configValues.GEMINI_API_KEY = 'test-secret-key';
    configValues.GEMINI_MODEL = 'gemini-test';
    fetchSpy.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init) requestOptions.push(init);
        requestUrls.push(
          typeof _input === 'string'
            ? _input
            : _input instanceof URL
              ? _input.href
              : _input.url,
        );
        if (typeof init?.body === 'string') requestBodies.push(init.body);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: 'Respuesta ' }, { text: 'de Gemini' }],
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      },
    );

    await expect(
      service.chat({
        message: 'Consulta actual',
        history: [
          { role: 'user', content: 'Consulta anterior' },
          { role: 'assistant', content: 'Respuesta anterior' },
        ],
      }),
    ).resolves.toMatchObject({
      answer: 'Respuesta de Gemini',
      sources: [],
      recommendations: [],
    });

    expect(requestUrls[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent',
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const options = requestOptions[0];
    expect(options.method).toBe('POST');
    expect(new Headers(options.headers).get('x-goog-api-key')).toBe(
      'test-secret-key',
    );
    expect(requestBodies[0]).toContain(
      '"role":"user","parts":[{"text":"Consulta anterior"}]',
    );
    expect(requestBodies[0]).toContain(
      '"role":"model","parts":[{"text":"Respuesta anterior"}]',
    );
    expect(requestBodies[0]).toContain(
      '"role":"user","parts":[{"text":"Consulta actual"}]',
    );
    expect(requestBodies[0]).toContain('"systemInstruction":');
    expect(requestBodies[0]).toContain('No inventes ni confirmes servicios');
  });

  it('translates Gemini rate limits to HTTP 429', async () => {
    configValues.GEMINI_API_KEY = 'test-secret-key';
    fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));

    const error: unknown = await service
      .chat({ message: 'Consulta', history: [] })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(
      Number(HttpStatus.TOO_MANY_REQUESTS),
    );
  });

  it('does not expose a successful response when Gemini returns no text', async () => {
    configValues.GEMINI_API_KEY = 'test-secret-key';
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      service.chat({ message: 'Consulta', history: [] }),
    ).rejects.toThrow('Gemini no devolvió una respuesta de texto.');
  });
});
