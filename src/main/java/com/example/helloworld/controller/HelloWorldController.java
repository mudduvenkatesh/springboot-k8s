package com.example.helloworld.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HelloWorldController {

    /**
     * GET /api/v1/hello
     * Returns a simple Hello World greeting
     */
    @GetMapping("/hello")
    public ResponseEntity<Map<String, Object>> hello() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello, World!");
        response.put("status", "success");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("service", "helloworld-service");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/hello/{name}
     * Returns a personalized greeting
     */
    @GetMapping("/hello/{name}")
    public ResponseEntity<Map<String, Object>> helloName(@PathVariable String name) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello, " + name + "!");
        response.put("status", "success");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("service", "helloworld-service");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/hello
     * Returns a greeting based on request body
     */
    @PostMapping("/hello")
    public ResponseEntity<Map<String, Object>> helloPost(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "World");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello, " + name + "!");
        response.put("status", "success");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("service", "helloworld-service");
        response.put("version", "1.0.0");
        response.put("echo", body);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/info
     * Returns service information
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        Map<String, Object> response = new HashMap<>();
        response.put("application", "Hello World API");
        response.put("framework", "Spring Boot 4.0.6");
        response.put("javaVersion", System.getProperty("java.version"));
        response.put("endpoints", new String[]{
            "GET  /api/v1/hello",
            "GET  /api/v1/hello/{name}",
            "POST /api/v1/hello",
            "GET  /api/v1/info"
        });
        return ResponseEntity.ok(response);
    }
}
