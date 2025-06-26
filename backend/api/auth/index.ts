import express from 'express';
import axios from 'axios';
import type { Request, Response } from 'express';

const router = express.Router();

// Dummy authentication middleware for demonstration
function requireAuth(req: Request, res: Response, next: Function) {
  // In a real app, set req.user if authenticated
  if ((req as any).user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// /auth/me endpoint
router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json((req as any).user);
});

// /send-sms endpoint
router.post('/send-sms', async (req: Request, res: Response) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' });
  }
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SMS API key not configured' });
    }
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'v3',
      numbers: to,
      message,
      sender_id: 'FSTSMS',
      language: 'english'
    }, {
      headers: {
        'authorization': apiKey
      }
    });
    res.json({ success: true, result: response.data });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send SMS', details: err.message });
  }
});

export default router; 