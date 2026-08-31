import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Routes
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import complaintRoutes from './routes/complaints.js';
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/complaints', complaintRoutes);
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
//# sourceMappingURL=index.js.map