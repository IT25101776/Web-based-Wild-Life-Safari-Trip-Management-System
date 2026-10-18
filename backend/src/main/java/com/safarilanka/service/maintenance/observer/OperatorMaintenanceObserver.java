package com.safarilanka.service.maintenance.observer;

import com.safarilanka.model.Vehicle;
import com.safarilanka.service.AuditService;
import org.springframework.stereotype.Component;

/** Concrete observer representing Safari Operations. */
@Component
public class OperatorMaintenanceObserver implements MaintenanceObserver {
    private final AuditService audit;

    public OperatorMaintenanceObserver(AuditService audit) {
        this.audit = audit;
    }

    @Override
    public void update(Vehicle vehicle, String maintenanceStatus, String sourceActor) {
        audit.log(sourceActor, "MAINTENANCE_NOTIFY_OPERATOR",
                vehicle.getRegistrationNo() + " -> " + maintenanceStatus);
    }
}
