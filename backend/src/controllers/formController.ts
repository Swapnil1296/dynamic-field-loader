import { Request, Response } from 'express';
import {
  getFormConfiguration,
  saveFormSubmission,
} from '../services/formService';

export async function getConfiguration(
  req: Request,
  res: Response
): Promise<void> {
  const { product_code, channel_code, sub_channel_code } = req.query;

  if (!product_code || !channel_code || !sub_channel_code) {
    res.status(400).json({
      error: 'product_code, channel_code, and sub_channel_code are required',
    });
    return;
  }

  try {
    const config = await getFormConfiguration(
      String(product_code),
      String(channel_code),
      String(sub_channel_code)
    );

    if (!config) {
      res.status(404).json({ error: 'Form configuration not found' });
      return;
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching form configuration:', error);
    res.status(500).json({ error: 'Failed to fetch form configuration' });
  }
}

export async function submitForm(req: Request, res: Response): Promise<void> {
  const { product_code, channel_code, sub_channel_code, form_data } = req.body;

  if (!product_code || !channel_code || !sub_channel_code || !form_data) {
    res.status(400).json({
      error:
        'product_code, channel_code, sub_channel_code, and form_data are required',
    });
    return;
  }

  try {
    const config = await getFormConfiguration(
      product_code,
      channel_code,
      sub_channel_code
    );
    if (!config) {
      res.status(404).json({ error: 'Form configuration not found' });
      return;
    }

    const reference = `${product_code}-${channel_code}-${sub_channel_code}-${Date.now()}`;
    const submission = await saveFormSubmission(reference, {
      product_code,
      channel_code,
      sub_channel_code,
      ...form_data,
    });

    res.status(201).json({
      message: 'Form submitted successfully',
      submission_id: submission.id,
      created_at: submission.created_at,
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
}
