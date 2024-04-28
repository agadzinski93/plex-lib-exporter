import express from "express";
import { verifyMethods, } from "../utilities/middleware/verifyMethods";
import { authenticate } from "../utilities/middleware/authenticate";
const router = express.Router();
import { loginUser } from "../controllers/authCont";

router.route('/login')
    .post(authenticate, loginUser)
    .all(verifyMethods(['POST']));

export {
    router
};