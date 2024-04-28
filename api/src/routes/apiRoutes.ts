import { Router } from "express";
import { router as authRouter } from "./authRoutes";
import { router as adminRoutes } from "./adminRoutes";

const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRoutes);
export { apiRouter };