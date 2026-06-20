import express from 'express';
import cors from 'cors';
import formRoutes from './routes/formRoutes';
import { env } from './config/env';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', formRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
