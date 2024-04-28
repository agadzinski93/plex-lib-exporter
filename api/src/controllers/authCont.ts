import { Request, Response } from "express";
import { ApiResponse } from "../utilities/ApiResponse";
import { logger } from "../utilities/logger";

import { TVDB_API_KEY, TVDB_API_SERVER } from "../utilities/config";

const loginUser = async (req: Request, res: Response): Promise<void> => {
    const Response = new ApiResponse('error', 500, 'Something went wrong.');
    try {
        const response = await fetch(`${TVDB_API_SERVER}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apikey: TVDB_API_KEY
            })
        });
        const data = await response.json();
        Response.setApiResponse('success', 200, 'Logged In! Your auth token will expire in one month.', '/', { data });
    } catch (err) {
        Response.applyMessage((err as Error).message, 'Error loggin in.');
        logger.log('error', (err as Error).message);
    }
    res.status(Response.getStatus).json(Response.getApiResponse());
}

export {
    loginUser
};