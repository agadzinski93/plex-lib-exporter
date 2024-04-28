class AppError extends Error {
    status: number;

    constructor(status: number, msg: string) {
        super();
        this.message = msg || "Something went wrong";
        this.status = status || 500;
    }
};
export { AppError };