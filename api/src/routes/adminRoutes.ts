import express from 'express';
import { verifyMethods } from '../utilities/middleware/verifyMethods';
import { authenticate } from '../utilities/middleware/authenticate';
import {
    createSeriesDB,
    createMovieDB
} from '../controllers/adminCont';
const router = express.Router();

router.route('/createSeriesDB')
    .post(authenticate, createSeriesDB)
    .all(verifyMethods(['POST']));

router.route('/createMovieDB')
    .post(authenticate, createMovieDB)
    .all(verifyMethods(['POST']));

export {
    router
};