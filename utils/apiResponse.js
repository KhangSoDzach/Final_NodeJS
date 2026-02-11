class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static error(res, message = 'Error', statusCode = 400, errors = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }

    static paginated(res, data, pagination, message = 'Success') {
        return res.json({
            success: true,
            message,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: Math.ceil(pagination.total / pagination.limit)
            }
        });
    }
}

module.exports = ApiResponse;
