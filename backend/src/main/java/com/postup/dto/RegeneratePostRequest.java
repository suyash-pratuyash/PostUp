package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class RegeneratePostRequest {
    @JsonProperty("post_id")
    private Long postId;

    private String feedback;
    private String tone;
}
