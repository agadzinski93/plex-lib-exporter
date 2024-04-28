/**
 * The purpose of this file is to dynamically add 405 responses to unused methods
 * for each route. It also handles the OPTIONS method and returns usable methods
 * to the client for that route.
 * 
 * The OPTIONS method and methods that return 405 will also have the 'Allow'
 * header included in the response.
 */

import { AppError } from "../AppError";

import type {
    sendOptionsResponseFn,
    verifyMethodsFn
} from "../../../types/middleware";

const sendOptionsResponse: sendOptionsResponseFn = (methods, res) => {
    let output = '';
    for (let i = 0; i < methods.length; i++) {
        if (i === methods.length - 1) {
            output += `${methods[i]}`;
        }
        else {
            output += `${methods[i]},`;
        }
    }
    res.set('Allow', output);
    return output;
}

/**
 * Verify that the requested HTTP method exists for path
 * @param {string[]} methods - array of acceptable HTTP methods (do NOT include OPTIONS as it's generated automatically) 
 * @returns 
 */
const verifyMethods: verifyMethodsFn = (methods) => {
    return async (req, res, next) => {
        const origin = req.get('HOST') ? req.get('HOST') : '*';
        const options = sendOptionsResponse(methods, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Origin', origin);
            res.set('Access-Control-Allow-Methods', options);
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.set('Access-Control-Max-Age', '3600');
            return res.status(204).send();
        }
        else {
            return next(new AppError(405, `${req.method} method not allowed`));
        }
    }
}

export { verifyMethods };