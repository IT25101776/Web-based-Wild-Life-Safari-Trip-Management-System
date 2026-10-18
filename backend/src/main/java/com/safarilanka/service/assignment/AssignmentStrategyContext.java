package com.safarilanka.service.assignment;

import com.safarilanka.model.User;
import org.springframework.stereotype.Component;
import java.util.List;

/** Context that selects and executes an assignment strategy at runtime. */
@Component
public class AssignmentStrategyContext {
    private final List<AssignmentStrategy> strategies;

    public AssignmentStrategyContext(List<AssignmentStrategy> strategies) {
        this.strategies = strategies;
    }

    public User select(String strategyKey, List<User> candidates, Long preferredId) {
        AssignmentStrategy strategy = strategies.stream()
                .filter(x -> x.key().equalsIgnoreCase(strategyKey))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown assignment strategy: " + strategyKey));
        return strategy.select(candidates, preferredId);
    }
}
