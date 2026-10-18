package com.safarilanka.controller;

import com.safarilanka.repository.SystemSettingRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/public-settings")
public class PublicSettingsController {
    private final SystemSettingRepository settings;
    public PublicSettingsController(SystemSettingRepository settings){this.settings=settings;}

    @GetMapping("/chatbot")
    public Map<String,Object> chatbot(){
        boolean enabled=settings.findBySettingKey("chatbot.enabled")
                .map(s->!Set.of("false","0","off","disabled","no").contains(String.valueOf(s.getSettingValue()).trim().toLowerCase(Locale.ROOT)))
                .orElse(true);
        return Map.of("enabled",enabled);
    }
}
