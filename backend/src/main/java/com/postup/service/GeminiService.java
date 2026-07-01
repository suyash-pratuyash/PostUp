package com.postup.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.postup.entity.DailyLog;
import com.postup.entity.Project;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String> TONE_INSTRUCTIONS = Map.of(
        "professional", """
            Write in a polished, authoritative tone. Use industry-standard terminology.
            Be concise and impactful. Sound confident and knowledgeable.
            This should read like a post from a respected industry professional.
            """,
        "casual", """
            Write in a friendly, conversational tone. Use simple language.
            Be relatable and approachable. It's okay to use contractions and informal phrasing.
            This should feel like talking to a friend about your work.
            """,
        "storytelling", """
            Write in a narrative, story-driven tone. Create a journey.
            Use vivid descriptions and build a narrative arc (challenge → action → result).
            Make the reader feel like they're experiencing the journey with you.
            """,
        "motivational", """
            Write in an inspiring, energetic tone. Be uplifting and encouraging.
            Include actionable takeaways. Use powerful, punchy sentences.
            This should motivate others to take action and pursue their goals.
            """
    );

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("your_api_key_here");
    }

    public String generateLinkedInPost(String input, String tone) {
        String toneGuide = TONE_INSTRUCTIONS.getOrDefault(tone, TONE_INSTRUCTIONS.get("professional"));

        String prompt = """
            You are an expert LinkedIn content writer. Your job is to transform raw input about someone's work, learnings, or achievements into a highly engaging LinkedIn post.

            ## LINKEDIN POST RULES (MUST FOLLOW):
            1. **Hook (first 2 lines)**: Write a scroll-stopping opening line that sparks curiosity or makes a bold statement. This MUST be within the first 210 characters because LinkedIn truncates after that on mobile.
            2. **Length**: The post should be between 1,300–1,900 characters (sweet spot for engagement).
            3. **Formatting**: Use single line breaks between sentences/thoughts for readability. Use short paragraphs (1-2 sentences max). Add spacing — LinkedIn posts need whitespace.
            4. **Hashtags**: Add exactly 3-5 relevant hashtags at the very end of the post.
            5. **Call to Action**: End with a question or call to action to encourage engagement.
            6. **Emojis**: Use emojis sparingly and strategically (1-3 max) to add visual interest.
            7. **No external links** in the post body.
            8. **Avoid** buzzwords, clichés like "excited to share", "thrilled to announce", "I'm humbled". Be authentic.

            ## TONE:
            %s

            ## RAW INPUT TO TRANSFORM:
            %s

            ## OUTPUT:
            Write ONLY the LinkedIn post content. No explanations, no metadata, no markdown formatting. Just the raw post text ready to be copied and pasted into LinkedIn.
            """.formatted(toneGuide, input);

        return callGemini(prompt);
    }

    public String regenerateWithFeedback(String originalPost, String feedback, String tone) {
        String toneGuide = TONE_INSTRUCTIONS.getOrDefault(tone, TONE_INSTRUCTIONS.get("professional"));

        String prompt = """
            You are an expert LinkedIn content writer. You previously generated a LinkedIn post, and the user wants modifications.

            ## ORIGINAL POST:
            %s

            ## USER FEEDBACK:
            %s

            ## TONE:
            %s

            ## LINKEDIN POST RULES:
            1. Hook in first 210 characters (scroll-stopping opener)
            2. 1,300–1,900 characters total
            3. Short paragraphs with line breaks
            4. 3-5 hashtags at end
            5. End with CTA/question
            6. Sparingly use emojis (1-3 max)
            7. No external links
            8. Avoid clichés

            ## OUTPUT:
            Write ONLY the modified LinkedIn post. No explanations. Just the post text.
            """.formatted(originalPost, feedback, toneGuide);

        return callGemini(prompt);
    }

    public String generateProjectOverview(Project project, List<DailyLog> logs, String tone) {
        String journeyEntries = logs.stream()
                .map(log -> {
                    String tags = log.getTags() != null ? log.getTags() : "[]";
                    try {
                        List<?> tagList = objectMapper.readValue(tags, List.class);
                        String tagStr = tagList.isEmpty() ? "" : " [Tags: " + String.join(", ", tagList.stream().map(Object::toString).collect(Collectors.toList())) + "]";
                        return "Day %s: \"%s\" — %s%s".formatted(
                                log.getDayNumber() != null ? log.getDayNumber().toString() : "?",
                                log.getTitle(),
                                log.getContent(),
                                tagStr
                        );
                    } catch (Exception e) {
                        return "Day %s: \"%s\" — %s".formatted(
                                log.getDayNumber() != null ? log.getDayNumber().toString() : "?",
                                log.getTitle(),
                                log.getContent()
                        );
                    }
                })
                .collect(Collectors.joining("\n"));

        Set<String> allTags = new LinkedHashSet<>();
        for (DailyLog log : logs) {
            try {
                List<?> tagList = objectMapper.readValue(log.getTags() != null ? log.getTags() : "[]", List.class);
                tagList.forEach(t -> allTags.add(t.toString()));
            } catch (Exception ignored) {}
        }

        String prompt = """
            You are an expert LinkedIn content writer specializing in project journey posts. Your task is to create a compelling LinkedIn post that summarizes an entire project journey.

            ## PROJECT DETAILS:
            - **Project Name**: %s
            - **Description**: %s
            - **Status**: %s
            - **Total Days Logged**: %d
            - **Key Topics/Tags**: %s

            ## DAY-BY-DAY JOURNEY:
            %s

            ## LINKEDIN POST RULES (MUST FOLLOW):
            1. **Hook (first 2 lines)**: Create an attention-grabbing opener. Must be within first 210 characters.
            2. **Length**: 1,300–1,900 characters.
            3. **Structure**: Tell the project story — the challenge, the journey, key milestones, and the outcome.
            4. **Format**: Use line breaks, short paragraphs. This is NOT an essay.
            5. **Hashtags**: 3-5 relevant hashtags at the end.
            6. **CTA**: End with a question or call to action.
            7. **Emojis**: Use 1-3 strategically placed emojis.
            8. **Authenticity**: Show vulnerability, real challenges faced, and genuine learnings.
            9. **Pattern**: If applicable, use the "X days of Y" pattern (e.g., "30 days of learning React").

            ## TONE: %s

            ## OUTPUT:
            Write ONLY the LinkedIn post. No explanations, no metadata. Just the post content ready to copy-paste.
            """.formatted(
                project.getName(),
                project.getDescription() != null ? project.getDescription() : "No description provided",
                project.getStatus(),
                logs.size(),
                allTags.isEmpty() ? "None specified" : String.join(", ", allTags),
                journeyEntries.isEmpty() ? "No daily logs available yet." : journeyEntries,
                tone
        );

        return callGemini(prompt);
    }

    private String callGemini(String prompt) {
        if (!isConfigured()) {
            throw new RuntimeException("Gemini API key not configured. Please add your API key to application.properties.\nGet a free key at: https://aistudio.google.com/");
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");

            if (candidates.isArray() && !candidates.isEmpty()) {
                return candidates.get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text")
                        .asText()
                        .trim();
            }

            throw new RuntimeException("No response from Gemini AI");
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            throw new RuntimeException("Failed to generate content: " + e.getMessage(), e);
        }
    }
}
