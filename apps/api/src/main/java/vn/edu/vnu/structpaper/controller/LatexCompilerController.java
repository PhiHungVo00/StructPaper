package vn.edu.vnu.structpaper.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vnu.structpaper.dto.request.CompileLatexRequest;
import vn.edu.vnu.structpaper.dto.response.CompileJsonResponse;
import vn.edu.vnu.structpaper.model.CompilationResult;
import vn.edu.vnu.structpaper.service.LatexCompilerService;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/compile")
@Tag(name = "LaTeX Compilation", description = "Các API biên dịch mã nguồn LaTeX sang định dạng PDF chuẩn xuất bản")
public class LatexCompilerController {

    private final LatexCompilerService compilerService;

    public LatexCompilerController(LatexCompilerService compilerService) {
        this.compilerService = compilerService;
    }

    @PostMapping(value = "/latex", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Biên dịch LaTeX sang file PDF", description = "Nhận mã nguồn .tex thô và trả về trực tiếp luồng nhị phân PDF (Content-Type: application/pdf)")
    public ResponseEntity<byte[]> compileToPdf(@Valid @RequestBody CompileLatexRequest request) {
        CompilationResult result = compilerService.compile(request);

        String filename = request.getJobName() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header("X-Compiler-Engine", result.engineUsed())
                .header("X-Compilation-Time-Ms", String.valueOf(result.durationMs()))
                .body(result.pdfBytes());
    }

    @PostMapping(value = "/latex/json", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Biên dịch LaTeX trả về JSON", description = "Trả về chuỗi PDF Base64 cùng đầy đủ nhật ký biên dịch và thời gian thực thi")
    public ResponseEntity<CompileJsonResponse> compileToJson(@Valid @RequestBody CompileLatexRequest request) {
        CompilationResult result = compilerService.compile(request);

        String base64Pdf = Base64.getEncoder().encodeToString(result.pdfBytes());

        CompileJsonResponse response = new CompileJsonResponse(
                true,
                base64Pdf,
                result.engineUsed(),
                result.durationMs(),
                result.pdfBytes().length,
                result.stdoutLog(),
                result.stderrLog()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Tải file .tex lên để biên dịch", description = "Nhận file .tex được tải lên từ client và trả về file PDF đã biên dịch")
    public ResponseEntity<byte[]> compileUploadedFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "engine", defaultValue = "auto") String engine) {

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.tex";
            String jobName = originalName.replaceAll("\\.tex$", "");

            CompileLatexRequest request = new CompileLatexRequest(content);
            request.setEngine(engine);
            request.setJobName(jobName);

            return compileToPdf(request);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file tải lên: " + e.getMessage(), e);
        }
    }
}
