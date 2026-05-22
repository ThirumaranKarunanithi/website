package com.magizhchi.dbcommunicator.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.magizhchi.dbcommunicator.config.OllamaProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    private final OllamaProperties props;
    private final ObjectMapper mapper;
    private final HttpClient httpClient;

    public OllamaClient(OllamaProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String generate(String prompt) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", props.getModel());
            body.put("prompt", prompt);
            body.put("stream", false);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(props.getBaseUrl() + "/api/generate"))
                    .timeout(Duration.ofSeconds(props.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            log.debug("Calling Ollama at {} with model {}", props.getBaseUrl(), props.getModel());
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new OllamaException("Ollama returned " + response.statusCode() + ": " + response.body());
            }

            return mapper.readTree(response.body()).path("response").asText();
        } catch (OllamaException e) {
            throw e;
        } catch (java.net.ConnectException e) {
            throw new OllamaException("Cannot reach Ollama at " + props.getBaseUrl()
                    + ". Is `ollama serve` running and is model `" + props.getModel() + "` pulled?", e);
        } catch (Exception e) {
            throw new OllamaException("Ollama call failed: " + e.getMessage(), e);
        }
    }

    public static class OllamaException extends RuntimeException {
        public OllamaException(String message) { super(message); }
        public OllamaException(String message, Throwable cause) { super(message, cause); }
    }
}
