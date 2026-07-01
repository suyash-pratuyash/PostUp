package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ProjectOverviewRequest {
    @JsonProperty("project_id")
    private Long projectId;

    private String tone;
}
