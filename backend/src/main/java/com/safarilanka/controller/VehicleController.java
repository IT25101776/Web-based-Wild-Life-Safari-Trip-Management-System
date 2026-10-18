package com.safarilanka.controller;

import com.safarilanka.dto.MaintenanceRequest;
import com.safarilanka.dto.VehicleRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.MaintenanceRecordRepository;
import com.safarilanka.repository.TripAssignmentRepository;
import com.safarilanka.repository.UserRepository;
import com.safarilanka.repository.VehicleRepository;
import com.safarilanka.service.AuditService;
import com.safarilanka.service.maintenance.observer.VehicleMaintenanceSubject;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleRepository vehicles;
    private final UserRepository users;
    private final MaintenanceRecordRepository maintenance;
    private final AuditService audit;
    private final TripAssignmentRepository assignments;
    private final VehicleMaintenanceSubject maintenanceSubject;

    public VehicleController(VehicleRepository v, UserRepository u, MaintenanceRecordRepository m, AuditService a, TripAssignmentRepository assignments,
                             VehicleMaintenanceSubject maintenanceSubject) {
        vehicles = v;
        users = u;
        maintenance = m;
        audit = a;
        this.assignments = assignments;
        this.maintenanceSubject = maintenanceSubject;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public List<Vehicle> all() {
        return vehicles.findAll();
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('JEEP_DRIVER')")
    public List<Vehicle> mine(Authentication a) {
        return vehicles.findByDriverEmail(a.getName());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public Vehicle create(@Valid @RequestBody VehicleRequest r, Authentication a) {
        if (vehicles.findByRegistrationNoIgnoreCase(r.registrationNo()).isPresent()) {
            throw new IllegalArgumentException("Registration number already exists");
        }
        Vehicle v = apply(new Vehicle(), r);
        vehicles.save(v);
        audit.log(a.getName(), "VEHICLE_CREATE", v.getRegistrationNo());
        return v;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public Vehicle update(@PathVariable Long id, @Valid @RequestBody VehicleRequest r, Authentication a) {
        Vehicle v = vehicles.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        apply(v, r);
        vehicles.save(v);
        audit.log(a.getName(), "VEHICLE_UPDATE", v.getRegistrationNo());
        return v;
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Vehicle archiveVehicle(@PathVariable Long id, Authentication a) {
        Vehicle v=vehicles.findById(id).orElseThrow(()->new IllegalArgumentException("Vehicle not found"));
        boolean activeAssignment=assignments.findAll().stream().anyMatch(x->x.getVehicle().getId().equals(id)
                && !List.of(AssignmentStatus.CANCELLED,AssignmentStatus.DECLINED,AssignmentStatus.COMPLETED).contains(x.getStatus()));
        if(activeAssignment) throw new IllegalStateException("This vehicle has an active safari assignment and cannot be archived");
        v.setStatus(VehicleStatus.INACTIVE);v.setDriver(null);vehicles.save(v);
        audit.log(a.getName(),"VEHICLE_ARCHIVE",v.getRegistrationNo());
        return v;
    }

    @GetMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','JEEP_DRIVER','SYSTEM_ADMIN')")
    public List<MaintenanceRecord> records(@PathVariable Long id, Authentication a) {
        Vehicle v = vehicles.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        ensureDriverOwnsVehicleWhenRequired(v, a);
        return maintenance.findByVehicleIdOrderByServiceDateDesc(id);
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','JEEP_DRIVER','SYSTEM_ADMIN')")
    public MaintenanceRecord addMaintenance(@PathVariable Long id, @Valid @RequestBody MaintenanceRequest r, Authentication a) {
        Vehicle v = vehicles.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        boolean driver = hasRole(a, "ROLE_JEEP_DRIVER") && !isManager(a);
        if (driver) ensureDriverOwnsVehicleWhenRequired(v, a);

        MaintenanceRecord m = new MaintenanceRecord();
        m.setVehicle(v);
        m.setServiceDate(r.serviceDate());
        m.setDescription(r.description().trim());
        m.setStatus(driver ? "SCHEDULED" : normalizeMaintenanceStatus(r.status()));
        maintenance.save(m);

        if (!"COMPLETED".equalsIgnoreCase(m.getStatus())) {
            v.setStatus(VehicleStatus.MAINTENANCE);
            vehicles.save(v);
        } else if (v.getStatus() == VehicleStatus.MAINTENANCE) {
            v.setStatus(VehicleStatus.AVAILABLE);
            vehicles.save(v);
        }
        audit.log(a.getName(), driver ? "MAINTENANCE_REPORTED" : "MAINTENANCE_ADD",
                v.getRegistrationNo() + " / " + m.getStatus());
        // Member 3 - Observer Pattern: registered Admin/Operator observers are notified.
        maintenanceSubject.notifyObservers(v, m.getStatus(), a.getName());
        return m;
    }


    @PutMapping("/maintenance/{recordId}")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','JEEP_DRIVER','SYSTEM_ADMIN')")
    public MaintenanceRecord editMaintenance(@PathVariable Long recordId,@Valid @RequestBody MaintenanceRequest r,Authentication a){
        MaintenanceRecord m=maintenance.findById(recordId).orElseThrow(()->new IllegalArgumentException("Maintenance record not found"));
        boolean manager=isManager(a); if(!manager) ensureDriverOwnsVehicleWhenRequired(m.getVehicle(),a);
        if(!manager && !"SCHEDULED".equalsIgnoreCase(m.getStatus())) throw new IllegalStateException("Drivers can edit only scheduled maintenance requests");
        m.setServiceDate(r.serviceDate());m.setDescription(r.description().trim());
        if(manager) m.setStatus(normalizeMaintenanceStatus(r.status())); else m.setStatus("SCHEDULED");
        maintenance.save(m);
        Vehicle v=m.getVehicle(); if(!"COMPLETED".equalsIgnoreCase(m.getStatus())){v.setStatus(VehicleStatus.MAINTENANCE);vehicles.save(v);}
        audit.log(a.getName(),"MAINTENANCE_UPDATE",v.getRegistrationNo()+" / record="+recordId);
        maintenanceSubject.notifyObservers(v,m.getStatus(),a.getName());
        return m;
    }

    @DeleteMapping("/maintenance/{recordId}")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','JEEP_DRIVER','SYSTEM_ADMIN')")
    public Map<String,Object> deleteMaintenance(@PathVariable Long recordId,Authentication a){
        MaintenanceRecord m=maintenance.findById(recordId).orElseThrow(()->new IllegalArgumentException("Maintenance record not found"));
        boolean manager=isManager(a); if(!manager) ensureDriverOwnsVehicleWhenRequired(m.getVehicle(),a);
        if(!"SCHEDULED".equalsIgnoreCase(m.getStatus())) throw new IllegalStateException("Only scheduled maintenance requests can be deleted");
        Vehicle v=m.getVehicle();maintenance.delete(m);
        boolean open=maintenance.findByVehicleIdOrderByServiceDateDesc(v.getId()).stream().anyMatch(x->!"COMPLETED".equalsIgnoreCase(x.getStatus()));
        if(!open && v.getStatus()==VehicleStatus.MAINTENANCE){v.setStatus(VehicleStatus.AVAILABLE);vehicles.save(v);}
        audit.log(a.getName(),"MAINTENANCE_DELETE",v.getRegistrationNo()+" / record="+recordId);
        maintenanceSubject.notifyObservers(v,open?"MAINTENANCE":"AVAILABLE",a.getName());
        return Map.of("deleted",true,"id",recordId);
    }

    @PatchMapping("/maintenance/{recordId}")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public MaintenanceRecord updateMaintenanceStatus(@PathVariable Long recordId,
                                                     @RequestBody Map<String, String> body,
                                                     Authentication a) {
        MaintenanceRecord m = maintenance.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance record not found"));
        String status = normalizeMaintenanceStatus(body.get("status"));
        m.setStatus(status);
        maintenance.save(m);

        Vehicle v = m.getVehicle();
        if ("COMPLETED".equals(status) && v.getStatus() == VehicleStatus.MAINTENANCE) {
            v.setStatus(VehicleStatus.AVAILABLE);
            vehicles.save(v);
        } else if (!"COMPLETED".equals(status)) {
            v.setStatus(VehicleStatus.MAINTENANCE);
            vehicles.save(v);
        }
        audit.log(a.getName(), "MAINTENANCE_STATUS", v.getRegistrationNo() + " -> " + status);
        maintenanceSubject.notifyObservers(v, status, a.getName());
        return m;
    }

    private Vehicle apply(Vehicle v, VehicleRequest r) {
        VehicleStatus previousStatus = v.getStatus();
        Long previousDriverId = v.getDriver()==null ? null : v.getDriver().getId();
        v.setRegistrationNo(r.registrationNo());
        v.setModel(r.model());
        v.setCapacity(r.capacity());
        v.setStatus(r.status() == null ? VehicleStatus.AVAILABLE : r.status());
        v.setDocumentValidUntil(r.documentValidUntil());
        if (r.driverId() == null) {
            v.setDriver(null);
        } else {
            User d = users.findById(r.driverId()).orElseThrow(() -> new IllegalArgumentException("Driver not found"));
            if (d.getRole() != Role.JEEP_DRIVER) throw new IllegalArgumentException("Selected user is not a Jeep Driver");
            boolean sameDriver = previousDriverId != null && previousDriverId.equals(d.getId());
            if (!sameDriver && previousStatus != null && previousStatus != VehicleStatus.AVAILABLE)
                throw new IllegalStateException("Only an AVAILABLE vehicle can be linked to a driver");
            for (Vehicle existing : vehicles.findByDriverId(d.getId())) {
                if (v.getId() == null || !existing.getId().equals(v.getId())) {
                    existing.setDriver(null);
                    vehicles.save(existing);
                }
            }
            if (v.getDriver() != null && !v.getDriver().getId().equals(d.getId())) {
                // explicit admin/operator edit is allowed to relink this vehicle to a new driver
                v.setDriver(null);
            }
            v.setDriver(d);
        }
        return v;
    }

    private void ensureDriverOwnsVehicleWhenRequired(Vehicle v, Authentication a) {
        if (isManager(a)) return;
        if (!hasRole(a, "ROLE_JEEP_DRIVER")) return;
        if (v.getDriver() == null || !v.getDriver().getEmail().equalsIgnoreCase(a.getName())) {
            throw new IllegalArgumentException("You can only access maintenance details for your linked vehicle");
        }
    }

    private boolean isManager(Authentication a) {
        return hasRole(a, "ROLE_SAFARI_OPERATOR") || hasRole(a, "ROLE_SYSTEM_ADMIN");
    }

    private boolean hasRole(Authentication a, String role) {
        return a.getAuthorities().stream().anyMatch(x -> x.getAuthority().equals(role));
    }

    private String normalizeMaintenanceStatus(String status) {
        String value = status == null || status.isBlank() ? "SCHEDULED" : status.trim().toUpperCase();
        if (!value.equals("SCHEDULED") && !value.equals("IN_PROGRESS") && !value.equals("COMPLETED")) {
            throw new IllegalArgumentException("Maintenance status must be SCHEDULED, IN_PROGRESS or COMPLETED");
        }
        return value;
    }
}
