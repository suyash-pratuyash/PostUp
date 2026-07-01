package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogDto {
    private Long id;

    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("day_number")
    private Integer dayNumber;

    private String title;
    private String content;
    private List<String> tags;

    @JsonProperty("project_name")
    private String projectName;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}
