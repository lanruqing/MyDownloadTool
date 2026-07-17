import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TransmissionService } from '../services/transmission.js';
import { loadConfig } from '../config/index.js';
const config = loadConfig();
describe('TransmissionService', () => {
    let service;
    let fetchMock;
    beforeEach(() => {
        service = new TransmissionService(config);
        fetchMock = vi.spyOn(globalThis, 'fetch');
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('should attach authorization header when credentials are set', async () => {
        const authConfig = { ...config, transmissionUsername: 'user', transmissionPassword: 'pass' };
        const authService = new TransmissionService(authConfig);
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ result: 'success', arguments: { foo: 'bar' } }),
        });
        const result = await authService.callRPC('session-get');
        expect(result).toEqual({ foo: 'bar' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const request = fetchMock.mock.calls[0][1];
        expect(request.headers).toMatchObject({
            Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
        });
    });
    it('should retry session id negotiation on 409', async () => {
        const firstResponse = {
            ok: false,
            status: 409,
            headers: {
                get: vi.fn().mockReturnValue('new-session-id'),
            },
            text: async () => 'Conflict',
        };
        const secondResponse = {
            ok: true,
            status: 200,
            json: async () => ({ result: 'success', arguments: { foo: 'bar' } }),
        };
        fetchMock.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);
        const result = await service.callRPC('session-get');
        expect(result).toEqual({ foo: 'bar' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    it('should throw when rpc call returns non-success result', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ result: 'failure', arguments: {} }),
        });
        await expect(service.callRPC('session-get')).rejects.toThrow('Transmission RPC error: failure');
    });
});
