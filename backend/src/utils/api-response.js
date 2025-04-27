class ApiResponse {
  constructor(statusCode, message = "success", data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400; // success flag for status codes below 400
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      success: this.success
    };
  }
}

export { ApiResponse };
