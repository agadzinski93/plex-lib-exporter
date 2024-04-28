import { NODE_ENV } from "./config";

export class ApiResponse {
    #response: string;
    #status: number;
    #message: string;
    #prevPath: string;
    #data: object;
    constructor(response: string, status: number, message: string, prevPath = '/', data = {}) {
        this.#response = response;
        this.#status = status;
        this.#message = message;
        this.#prevPath = prevPath;
        this.#data = data;
    }
    get getResponse() { return this.#response; }
    set setResponse(response: string) { this.#response = response; }
    get getStatus() { return this.#status; }
    set setStatus(status: number) { this.#status = status; }
    get getMessage() { return this.#message; }
    set setMessage(message: string) { this.#message = message; }
    get getPrevPath() { return this.#prevPath; }
    set setPrevPath(prevPath: string) { this.#prevPath = prevPath; }
    get getData() { return this.#data; }
    set setData(data: object) { this.#data = data; }

    /**
     * Set the message for the API response
     * @param {string} devMessage - API Response message when not in production
     * @param {string} publicMessage - API Response message when in production
     */
    applyMessage(devMessage: string, publicMessage: string): void {
        this.#message = (NODE_ENV !== 'production') ? devMessage : publicMessage;
    }

    setApiResponse(response: string, status: number, message: string, prevPath = '/', data = {}) {
        this.#response = response;
        this.#status = status;
        this.#message = message;
        this.#prevPath = prevPath;
        this.#data = data;
    }
    getApiResponse() {
        return {
            response: this.#response,
            status: this.#status,
            message: this.#message,
            prevPath: this.#prevPath,
            data: this.#data
        }
    }
};