package com.safarilanka.service.assignment;

import com.safarilanka.model.User;
import java.util.List;

/** Member 4 - Strategy interface for selecting staff during trip assignment. */
public interface AssignmentStrategy {
    String key();
    User select(List<User> candidates, Long preferredId);
}
