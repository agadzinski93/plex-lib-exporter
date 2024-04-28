import { ApiResponse } from "../utilities/ApiResponse";
import { AppError } from "../utilities/AppError";
import { logger } from "../utilities/logger";
import { TVDB_API_SERVER } from "../utilities/config";
import { getDatabase } from "../utilities/db/mysql";

import { NextFunction, Request, Response } from "express";

const createSeriesDB = async (req: Request, res: Response): Promise<void> => {
    const Response = new ApiResponse('error', 500, 'Something went wrong.');
    const token: string | undefined = req.body.token;
    try {
        if (token) {
            let done = false
            let i = 0;

            let idList = Array();

            do {
                const tv_shows = await fetch(`${TVDB_API_SERVER}/series?page=${i}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await tv_shows.json();

                const list = data.data;

                if (Array.isArray(list) && list.length > 0) {
                    for (const item of list) {
                        idList.push(item.id);
                    }
                }

                if (!data?.links.next) {
                    done = true;
                }
                i++;
            } while (!done && i < 1000);

            if (idList.length > 0) {
                const db = await getDatabase();
                if (db instanceof AppError) throw new AppError(db.status, db.message);

                const sql = `INSERT INTO tv_shows(api_id,name,year,num_of_seasons,status,start_date,end_date,
                    avg_episode_duration,keep_updated,original_country,original_language,original_network,content_rating) 
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                for (const id of idList) {
                    try {
                        const tv_show = await fetch(`${TVDB_API_SERVER}/series/${id}/extended?meta=translations&short=true`, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        const res = await tv_show.json();

                        //Check if not English, find English title
                        const data = res.data;
                        let name = data.name;
                        if (data.originalCountry !== 'usa' && data.originalLanguage !== 'eng') {
                            if (Array.isArray(data.aliases) && data.aliases.length > 0) {
                                let done = false;
                                let i = 0;
                                do {
                                    if (data.aliases[i].language === 'eng') {
                                        name = data.aliases[i].name;
                                        done = true;
                                    }
                                    i++;
                                } while (!done && i < data.aliases.length);
                            }
                        }

                        //Find number of seasons
                        let numOfSeasons = 0;
                        if (Array.isArray(data.seasons) && data.seasons.length > 0) {
                            for (const season of data.seasons) {
                                if (season.type.id === 1) numOfSeasons++
                            }
                        }

                        //Find Content Rating
                        let rating = null;
                        if (Array.isArray(data.contentRatings) && data.contentRatings.length > 0) {
                            let done = false;
                            let i = 0;
                            do {
                                if (data.contentRatings[i].country === 'usa') {
                                    rating = data.contentRatings[i].name;
                                    done = true;
                                }
                                i++;
                            } while (!done && i < data.contentRatings.length);
                        }

                        let values = [data.id, name, data.year, numOfSeasons - 1, data.status.name, data.firstAired,
                        (data.lastAired === '') ? 'Still Airing' : data.lastAired, data.averageRuntime,
                        data.status.keepUpdated, data.originalCountry, data.originalLanguage,
                        data.originalNetwork.name || null, rating];

                        await db?.execute(sql, values);
                    } catch (err) {
                        logger.log('error', `TV Show ID failure: id: ${id}, Message: ${(err as Error).message}`);
                    }
                }
            }

            Response.setApiResponse('success', 200, 'Successfully, retrieved tv data.', '/', { data: idList });
        }
        else {
            Response.setStatus = 403;
            Response.applyMessage('Token missing', 'Token missing.');
            logger.log('error', 'Token is missing.');
        }

    } catch (err) {
        Response.applyMessage((err as Error).message, 'Error creating tv database.');
        logger.log('error', (err as Error).message);
    }
    res.status(Response.getStatus).json(Response.getApiResponse());
}

const createMovieDB = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const Response = new ApiResponse('error', 500, 'Something went wrong.');
    const token: string | undefined = req.body.token;
    try {
        if (token) {
            let done = false
            let i = 0;

            let idList = Array();

            do {
                const movies = await fetch(`${TVDB_API_SERVER}/movies?page=${i}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await movies.json();

                const list = data.data;

                if (Array.isArray(list) && list.length > 0) {
                    for (const item of list) {
                        idList.push(item.id);
                    }
                }

                if (!data?.links.next) {
                    done = true;
                }
                i++;
                if (i == 1) done = true;
            } while (!done && i < 1000);

            for (let i = 0; i < 490; i++) {
                idList.pop();
            }

            const db = await getDatabase();
            if (db instanceof AppError) throw new AppError(db.status, db.message);

            if (idList.length > 0 && db) {


                const sql = `INSERT INTO movies(api_id,name,year,duration,keep_updated,budget,
                    box_office,original_country,content_rating) 
                    VALUES(?,?,?,?,?,?,?,?,?)`;

                for (const id of idList) {
                    try {
                        const movie = await fetch(`${TVDB_API_SERVER}/movies/${id}/extended?meta=translations&short=true`, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        const res = await movie.json();
                        const data = res.data;

                        //Find Release Date
                        let release = null;
                        if (Array.isArray(data.releases) && data.releases.length > 0) {
                            let done = false;
                            let i = 0;
                            do {
                                if (data.releases[i].country === 'usa') {
                                    release = data.releases[i].date;
                                    done = true;
                                }
                                i++;
                            } while (!done && i < data.releases.length);
                        }

                        //Find Content Rating
                        let rating = null;
                        if (Array.isArray(data.contentRatings) && data.contentRatings.length > 0) {
                            let done = false;
                            let i = 0;
                            do {
                                if (data.contentRatings[i].country === 'usa') {
                                    rating = data.contentRatings[i].name;
                                    done = true;
                                }
                                i++;
                            } while (!done && i < data.contentRatings.length);
                        }

                        let values = [data.id, data.name, data.year, data.runtime, data.status.keepUpdated, data.budget,
                        data.boxOffice, data.originalCountry, rating];

                        await db.execute(sql, values);
                    } catch (err) {
                        logger.log('error', `Movie ID failure: id: ${id}, Message: ${(err as Error).message}`);
                    }
                }
            }
            Response.setApiResponse('success', 200, 'Successfully retrieved movie data.', '/', { data: idList });

        } else {
            Response.setStatus = 403;
            Response.applyMessage('Token missing', 'Token missing.');
            logger.log('error', 'Token is missing.');
        }
    } catch (err) {
        Response.applyMessage((err as Error).message, 'Error creating movie database.');
        logger.log('error', (err as Error).message);
    }
    res.status(Response.getStatus).json(Response.getApiResponse());
}

export {
    createSeriesDB,
    createMovieDB
};