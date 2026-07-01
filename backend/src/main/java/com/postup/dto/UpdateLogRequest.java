package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class UpdateLogRequest {
    private String title;
    private String content;
    private List<String> tags;

    @JsonProperty("day_number")
    private Integer dayNumber;
}
