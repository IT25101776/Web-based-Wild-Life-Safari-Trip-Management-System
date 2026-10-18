package com.safarilanka.service.assignment;

import com.safarilanka.model.User;
import org.springframework.stereotype.Component;
import java.util.List;

/** Alternative strategy kept ready for future automatic assignment. */
@Component
public class AvailabilityFirstAssignmentStrategy implements AssignmentStrategy {
    @Override
    public String key() { return "AVAILABILITY_FIRST"; }

    @Override
    public User select(List<User> candidates, Long preferredId) {
        return candidates.stream()
                .filter(User::isAvailable)
                .filter(x -> !x.isOnLeave())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No available staff member was found"));
    }
}
