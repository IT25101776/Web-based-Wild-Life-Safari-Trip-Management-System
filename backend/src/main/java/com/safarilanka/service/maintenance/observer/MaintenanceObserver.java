package com.safarilanka.service.maintenance.observer;

import com.safarilanka.model.Vehicle;

/** Member 3 - Observer interface for vehicle-maintenance changes. */
public interface MaintenanceObserver {
    void update(Vehicle vehicle, String maintenanceStatus, String sourceActor);
}
