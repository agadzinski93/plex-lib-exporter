import express from 'express';
import 'dotenv/config'
import { apiRouter } from './routes/apiRoutes';

import { Request, Response, NextFunction } from 'express';
import type { AppError } from './utilities/AppError';

const { NODE_ENV, PORT } = require('./utilities/config');

const app = express();
app.use(express.json());

app.use('/api/v1', apiRouter);

app.get('/_health', (req, res, next) => res.send('<h1>App is running!</h1>'));

app.use((err: AppError, req: Request, res: Response, next: NextFunction): void => {
    const status = err.status || 500;
    const message = (NODE_ENV === 'production') ? err.message : err.stack;
    res.status(status).json(message);
});

app.listen(PORT, () => {
    console.log(`Listening on PORT: ${PORT}`);
});