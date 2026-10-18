package com.safarilanka.service.maintenance.observer;

import com.safarilanka.model.Vehicle;
import com.safarilanka.service.AuditService;
import org.springframework.stereotype.Component;

/** Concrete observer representing the System Administrator view of maintenance changes. */
@Component
public class AdminMaintenanceObserver implements MaintenanceObserver {
    private final AuditService audit;

    public AdminMaintenanceObserver(AuditService audit) {
        this.audit = audit;
    }

    @Override
    public void update(Vehicle vehicle, String maintenanceStatus, String sourceActor) {
        audit.log(sourceActor, "MAINTENANCE_NOTIFY_ADMIN",
                vehicle.getRegistrationNo() + " -> " + maintenanceStatus);
    }
}
