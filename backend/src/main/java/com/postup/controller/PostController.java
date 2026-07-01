package com.postup.controller;

import com.postup.dto.*;
import com.postup.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GeneratedPostDto>> generatePost(@RequestBody GeneratePostRequest request) {
        try {
            GeneratedPostDto post = postService.generatePost(
                    request.getInput(),
                    request.getTone(),
                    request.getDailyLogId(),
                    request.getProjectId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("API key")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate post. " + e.getMessage()));
        }
    }

    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<GeneratedPostDto>> regeneratePost(@RequestBody RegeneratePostRequest request) {
        try {
            GeneratedPostDto post = postService.regeneratePost(
                    request.getPostId(),
                    request.getFeedback(),
                    request.getTone()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Original post not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to regenerate post. " + e.getMessage()));
        }
    }

    @PostMapping("/project-overview")
    public ResponseEntity<ApiResponse<GeneratedPostDto>> generateProjectOverview(@RequestBody ProjectOverviewRequest request) {
        try {
            GeneratedPostDto post = postService.generateProjectOverview(
                    request.getProjectId(),
                    request.getTone()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Project not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate overview. " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GeneratedPostDto>>> getAllPosts(
            @RequestParam(name = "project_id", required = false) Long projectId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            List<GeneratedPostDto> posts = postService.getAllPosts(projectId, limit, offset);
            return ResponseEntity.ok(ApiResponse.ok(posts));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch posts"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GeneratedPostDto>> getPost(@PathVariable Long id) {
        try {
            GeneratedPostDto post = postService.getPost(id);
            return ResponseEntity.ok(ApiResponse.ok(post));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Post not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch post"));
        }
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<GeneratedPostDto>> toggleFavorite(@PathVariable Long id) {
        try {
            GeneratedPostDto post = postService.toggleFavorite(id);
            return ResponseEntity.ok(ApiResponse.ok(post));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Post not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to toggle favorite"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        try {
            postService.deletePost(id);
            return ResponseEntity.ok(ApiResponse.ok("Post deleted successfully"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Post not found"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete post"));
        }
    }
}
