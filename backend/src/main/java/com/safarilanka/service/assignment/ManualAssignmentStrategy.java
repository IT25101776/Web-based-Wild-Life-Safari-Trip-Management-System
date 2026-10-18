package com.safarilanka.service.assignment;

import com.safarilanka.model.User;
import org.springframework.stereotype.Component;
import java.util.List;

/** Current production behavior: use the staff member explicitly chosen by Safari Operations. */
@Component
public class ManualAssignmentStrategy implements AssignmentStrategy {
    @Override
    public String key() { return "MANUAL"; }

    @Override
    public User select(List<User> candidates, Long preferredId) {
        if (preferredId == null) throw new IllegalArgumentException("Select a staff member");
        return candidates.stream()
                .filter(x -> x.getId().equals(preferredId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Selected staff member was not found"));
    }
}
