package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class CreateLogRequest {
    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("day_number")
    private Integer dayNumber;

    private String title;
    private String content;
    private List<String> tags;
}

