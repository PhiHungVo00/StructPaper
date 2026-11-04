package vn.edu.vnu.structpaper.dto.response;

public record ErrorResponse(
        int status,
        String error,
        String message,
        String engine,
        String details,
        String rawLog,
        long timestamp
) {
    public static ErrorResponse of(int status, String error, String message, String engine, String details, String rawLog) {
        return new ErrorResponse(status, error, message, engine, details, rawLog, System.currentTimeMillis());
    }
}
