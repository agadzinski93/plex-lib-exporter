import { AppError } from "../AppError"

import { authenticateFn } from "../../../types/middleware"
import { API_PASSWORD } from "../config"

const authenticate: authenticateFn = (req, res, next) => {
    if (req.body.password === API_PASSWORD)
        next()
    else
        next(new AppError(401, "You are not authorized to view this data."));
}

export {
    authenticate
}