package com.postup.controller;

import com.postup.dto.*;
import com.postup.service.DailyLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class DailyLogController {

    private final DailyLogService dailyLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DailyLogDto>>> getAllLogs(
            @RequestParam(name = "project_id", required = false) Long projectId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            List<DailyLogDto> logs = dailyLogService.getAllLogs(projectId, limit, offset);
            return ResponseEntity.ok(ApiResponse.ok(logs));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch logs"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DailyLogDto>> getLog(@PathVariable Long id) {
        try {
            DailyLogDto log = dailyLogService.getLog(id);
            return ResponseEntity.ok(ApiResponse.ok(log));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Log not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch log"));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DailyLogDto>> createLog(@RequestBody CreateLogRequest request) {
        try {
            DailyLogDto log = dailyLogService.createLog(
                    request.getProjectId(),
                    request.getDayNumber(),
                    request.getTitle(),
                    request.getContent(),
                    request.getTags()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(log));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create log"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DailyLogDto>> updateLog(@PathVariable Long id, @RequestBody UpdateLogRequest request) {
        try {
            DailyLogDto log = dailyLogService.updateLog(id, request.getTitle(), request.getContent(), request.getTags(), request.getDayNumber());
            return ResponseEntity.ok(ApiResponse.ok(log));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Log not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update log"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLog(@PathVariable Long id) {
        try {
            dailyLogService.deleteLog(id);
            return ResponseEntity.ok(ApiResponse.ok("Log deleted successfully"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Log not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete log"));
        }
    }
}
