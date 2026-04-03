import { Request, Response } from 'express';
import { getUnreadCount } from '../src/controllers/notification.controller';

jest.mock('../src/services/notification.service', () => ({
  getUnreadCount: jest.fn().mockResolvedValue(3),
}));

describe('Notification controller', () => {
  it('returns unread count for authenticated user', async () => {
    const req = { user: { id: 'user-1' } } as unknown as Request;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await getUnreadCount(req, res);

    expect(res.json).toHaveBeenCalledWith({ count: 3 });
  });
});
