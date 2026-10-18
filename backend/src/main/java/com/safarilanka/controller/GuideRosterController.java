package com.safarilanka.controller;

import com.safarilanka.dto.GuideRosterRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/guide-rosters")
public class GuideRosterController {
    private final GuideRosterRepository rosters;
    private final TripAssignmentRepository assignments;
    private final CurrentUserService current;
    private final AuditService audit;

    public GuideRosterController(GuideRosterRepository rosters, TripAssignmentRepository assignments,
                                 CurrentUserService current, AuditService audit) {
        this.rosters=rosters; this.assignments=assignments; this.current=current; this.audit=audit;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SAFARI_GUIDE')")
    public List<GuideRoster> mine(Authentication a){
        return rosters.findByGuideEmailOrderByRosterDateAsc(a.getName());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public List<GuideRoster> all(){return rosters.findAllByOrderByRosterDateAsc();}

    @PostMapping
    @PreAuthorize("hasRole('SAFARI_GUIDE')")
    public GuideRoster create(@Valid @RequestBody GuideRosterRequest r, Authentication a){
        User guide=current.get(a);
        String shift=normalizeShift(r.shift());
        if(rosters.existsByGuideIdAndRosterDateAndShiftIgnoreCase(guide.getId(),r.rosterDate(),shift))
            throw new IllegalStateException("A roster entry already exists for this date and shift");
        GuideRoster row=new GuideRoster();
        row.setGuide(guide); apply(row,r,shift); rosters.save(row);
        audit.log(a.getName(),"GUIDE_ROSTER_CREATE",r.rosterDate()+" / "+shift);
        return row;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SAFARI_GUIDE')")
    public GuideRoster update(@PathVariable Long id,@Valid @RequestBody GuideRosterRequest r,Authentication a){
        GuideRoster row=owned(id,a);
        ensureEditable(row);
        String shift=normalizeShift(r.shift());
        for(GuideRoster other:rosters.findByGuideIdAndRosterDate(row.getGuide().getId(),r.rosterDate())){
            if(!other.getId().equals(row.getId()) && other.getShift().equalsIgnoreCase(shift))
                throw new IllegalStateException("A roster entry already exists for this date and shift");
        }
        apply(row,r,shift); rosters.save(row);
        audit.log(a.getName(),"GUIDE_ROSTER_UPDATE",r.rosterDate()+" / "+shift);
        return row;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SAFARI_GUIDE')")
    public Map<String,Object> delete(@PathVariable Long id,Authentication a){
        GuideRoster row=owned(id,a); ensureEditable(row);
        rosters.delete(row);
        audit.log(a.getName(),"GUIDE_ROSTER_DELETE",row.getRosterDate()+" / "+row.getShift());
        return Map.of("deleted",true,"id",id);
    }

    private GuideRoster owned(Long id,Authentication a){
        GuideRoster row=rosters.findById(id).orElseThrow(()->new IllegalArgumentException("Roster entry not found"));
        if(!row.getGuide().getEmail().equalsIgnoreCase(a.getName())) throw new IllegalArgumentException("You can only manage your own roster");
        return row;
    }

    private void ensureEditable(GuideRoster row){
        if(row.getRosterDate().isBefore(LocalDate.now())) throw new IllegalStateException("Past roster entries are read-only");
        boolean assigned=assignments.findByGuideIdAndBookingVisitDate(row.getGuide().getId(),row.getRosterDate()).stream()
                .anyMatch(x->x.getStatus()!=AssignmentStatus.CANCELLED && x.getStatus()!=AssignmentStatus.DECLINED);
        if(assigned) throw new IllegalStateException("This roster date is already linked to a safari assignment and cannot be edited or deleted");
    }

    private void apply(GuideRoster row,GuideRosterRequest r,String shift){
        row.setRosterDate(r.rosterDate()); row.setShift(shift);
        row.setAvailable(r.available()==null || r.available());
        row.setNotes(r.notes()==null?null:r.notes().trim());
    }

    private String normalizeShift(String value){
        String v=value==null?"":value.trim().toUpperCase(Locale.ROOT).replace(' ','_');
        if(!Set.of("MORNING","AFTERNOON","FULL_DAY").contains(v))
            throw new IllegalArgumentException("Shift must be MORNING, AFTERNOON or FULL_DAY");
        return v;
    }
}
