package com.safarilanka.controller;

import com.safarilanka.dto.GateComplianceRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/compliance")
public class GateComplianceController {
    private final GateComplianceRecordRepository records;
    private final PermitRepository permits;
    private final CurrentUserService current;
    private final AuditService audit;

    public GateComplianceController(GateComplianceRecordRepository records,PermitRepository permits,CurrentUserService current,AuditService audit){
        this.records=records;this.permits=permits;this.current=current;this.audit=audit;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('PARK_OFFICER')")
    public List<GateComplianceRecord> mine(Authentication a){return records.findByOfficerEmailOrderByCreatedAtDesc(a.getName());}

    @GetMapping
    @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
    public List<GateComplianceRecord> all(){return records.findAllByOrderByCreatedAtDesc();}

    @PostMapping
    @PreAuthorize("hasRole('PARK_OFFICER')")
    public GateComplianceRecord create(@Valid @RequestBody GateComplianceRequest r,Authentication a){
        Permit permit=permits.findById(r.permitId()).orElseThrow(()->new IllegalArgumentException("Permit not found"));
        GateComplianceRecord row=new GateComplianceRecord();row.setPermit(permit);row.setOfficer(current.get(a));apply(row,r);records.save(row);
        audit.log(a.getName(),"COMPLIANCE_CREATE",permit.getPermitCode()+" / "+row.getComplianceStatus());
        return row;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
    public GateComplianceRecord update(@PathVariable Long id,@Valid @RequestBody GateComplianceRequest r,Authentication a){
        GateComplianceRecord row=records.findById(id).orElseThrow(()->new IllegalArgumentException("Compliance record not found"));
        ensureCanManage(row,a);ensureDraft(row);
        Permit permit=permits.findById(r.permitId()).orElseThrow(()->new IllegalArgumentException("Permit not found"));
        row.setPermit(permit);apply(row,r);records.save(row);
        audit.log(a.getName(),"COMPLIANCE_UPDATE",permit.getPermitCode()+" / record="+id);
        return row;
    }

    @PatchMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
    public GateComplianceRecord finalizeRecord(@PathVariable Long id,Authentication a){
        GateComplianceRecord row=records.findById(id).orElseThrow(()->new IllegalArgumentException("Compliance record not found"));
        ensureCanManage(row,a);ensureDraft(row);
        row.setRecordStatus("FINALIZED");records.save(row);
        audit.log(a.getName(),"COMPLIANCE_FINALIZE",row.getPermit().getPermitCode()+" / "+row.getComplianceStatus());
        return row;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARK_OFFICER','SYSTEM_ADMIN')")
    public Map<String,Object> delete(@PathVariable Long id,Authentication a){
        GateComplianceRecord row=records.findById(id).orElseThrow(()->new IllegalArgumentException("Compliance record not found"));
        ensureCanManage(row,a);ensureDraft(row);records.delete(row);
        audit.log(a.getName(),"COMPLIANCE_DELETE",row.getPermit().getPermitCode()+" / record="+id);
        return Map.of("deleted",true,"id",id);
    }

    private void apply(GateComplianceRecord row,GateComplianceRequest r){
        row.setGateName(r.gateName().trim());row.setVehicleRegistration(clean(r.vehicleRegistration()));
        row.setPermitVerified(r.permitVerified());row.setVisitorCountVerified(r.visitorCountVerified());row.setVehicleVerified(r.vehicleVerified());
        row.setGuideVerified(r.guideVerified());row.setDriverVerified(r.driverVerified());row.setComplianceStatus(normalizeStatus(r.complianceStatus()));row.setNotes(clean(r.notes()));
    }
    private void ensureDraft(GateComplianceRecord row){if(!"DRAFT".equalsIgnoreCase(row.getRecordStatus()))throw new IllegalStateException("Finalized compliance records are read-only");}
    private void ensureCanManage(GateComplianceRecord row,Authentication a){
        boolean admin=a.getAuthorities().stream().anyMatch(x->x.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
        if(!admin&&!row.getOfficer().getEmail().equalsIgnoreCase(a.getName()))throw new IllegalArgumentException("You can only manage your own compliance records");
    }
    private String normalizeStatus(String v){String x=v==null?"":v.trim().toUpperCase(Locale.ROOT).replace(' ','_');if(!Set.of("PENDING","PASSED","ISSUE_FOUND").contains(x))throw new IllegalArgumentException("Compliance status must be PENDING, PASSED or ISSUE_FOUND");return x;}
    private String clean(String v){return v==null||v.trim().isEmpty()?null:v.trim();}
}
