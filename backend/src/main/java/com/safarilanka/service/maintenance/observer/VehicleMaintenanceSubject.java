package com.safarilanka.service.maintenance.observer;

import com.safarilanka.model.Vehicle;
import org.springframework.stereotype.Service;
import java.util.List;

/** Concrete Subject: notifies all registered MaintenanceObserver beans. */
@Service
public class VehicleMaintenanceSubject {
    private final List<MaintenanceObserver> observers;

    public VehicleMaintenanceSubject(List<MaintenanceObserver> observers) {
        this.observers = observers;
    }

    public void notifyObservers(Vehicle vehicle, String maintenanceStatus, String sourceActor) {
        for (MaintenanceObserver observer : observers) {
            observer.update(vehicle, maintenanceStatus, sourceActor);
        }
    }
}
