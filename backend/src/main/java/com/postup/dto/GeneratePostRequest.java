package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GeneratePostRequest {
    private String input;
    private String tone;

    @JsonProperty("daily_log_id")
    private Long dailyLogId;

    @JsonProperty("project_id")
    private Long projectId;
}
