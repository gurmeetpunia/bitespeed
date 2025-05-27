import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { IdentifyRequest } from '../types/database';

const contactService = new ContactService();

export const identifyController = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber }: IdentifyRequest = req.body;

    // Validate that at least one of email or phoneNumber is provided
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'At least one of email or phoneNumber must be provided'
      });
    }

    // Call the contact service
    const result = await contactService.identify({ email, phoneNumber });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in identify controller:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};