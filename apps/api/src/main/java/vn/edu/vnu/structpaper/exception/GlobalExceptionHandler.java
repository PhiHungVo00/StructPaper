package vn.edu.vnu.structpaper.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.edu.vnu.structpaper.dto.response.ErrorResponse;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(LatexCompilationException.class)
    public ResponseEntity<ErrorResponse> handleCompilationException(LatexCompilationException ex) {
        log.warn("Lỗi biên dịch LaTeX với engine {}: {}", ex.getEngine(), ex.getMessage());
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                "Lỗi biên dịch LaTeX (" + ex.getEngine() + ")",
                ex.getMessage(),
                ex.getEngine(),
                ex.getDetails(),
                ex.getRawLog()
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    @ExceptionHandler(CompilerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCompilerNotFound(CompilerNotFoundException ex) {
        log.error("Không tìm thấy compiler: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "TeX Engine Chưa Khả Dụng",
                ex.getMessage(),
                ex.getEngineRequested(),
                "Vui lòng kiểm tra cài đặt XeLaTeX hoặc Tectonic trong môi trường hệ thống.",
                ""
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Dữ liệu đầu vào không hợp lệ",
                details,
                "Validation",
                details,
                ""
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Lỗi hệ thống không mong muốn: ", ex);
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Lỗi máy chủ nội bộ",
                ex.getMessage(),
                "System",
                ex.getClass().getSimpleName(),
                ""
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
