package com.safarilanka.controller;

import com.safarilanka.dto.AssignmentRequest;
import com.safarilanka.model.*;
import com.safarilanka.repository.*;
import com.safarilanka.service.*;
import com.safarilanka.service.assignment.AssignmentStrategyContext;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
    private final TripAssignmentRepository assignments;
    private final BookingRepository bookings;
    private final VehicleRepository vehicles;
    private final UserRepository users;
    private final AuditService audit;
    private final AssignmentStrategyContext assignmentStrategyContext;
    private final GuideRosterRepository guideRosters;
    private final LeaveRequestRepository leaveRequests;
    private final PermitRepository permits;
    private final NotificationService notifications;
    private final CurrentUserService current;

    public AssignmentController(TripAssignmentRepository a, BookingRepository b, VehicleRepository v, UserRepository u, AuditService au,
                                AssignmentStrategyContext assignmentStrategyContext, GuideRosterRepository guideRosters,
                                LeaveRequestRepository leaveRequests, PermitRepository permits,
                                NotificationService notifications, CurrentUserService current) {
        assignments = a; bookings = b; vehicles = v; users = u; audit = au;
        this.assignmentStrategyContext = assignmentStrategyContext;
        this.guideRosters = guideRosters; this.leaveRequests=leaveRequests; this.permits=permits;
        this.notifications=notifications; this.current=current;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public List<TripAssignment> all(){return assignments.findAll();}

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('SAFARI_GUIDE','JEEP_DRIVER')")
    public List<TripAssignment> mine(Authentication a){
        List<TripAssignment> rows=assignments.findForStaff(a.getName());
        rows.forEach(x->x.setPermit(permits.findByBookingId(x.getBooking().getId()).orElse(null)));
        return rows;
    }

    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SYSTEM_ADMIN')")
    public TripAssignment assign(@PathVariable Long bookingId, @Valid @RequestBody AssignmentRequest r, Authentication a) {
        Booking b = bookings.findById(bookingId).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (b.getBookingStatus() != BookingStatus.CONFIRMED)
            throw new IllegalStateException("Safari Operator must confirm the booking before assigning resources");
        if (b.getPaymentStatus() != PaymentStatus.PAID)
            throw new IllegalStateException("Payment must be successfully completed or approved before assigning safari resources");

        List<TripAssignment> currentRows = assignments.findByBookingIdOrderByIdAsc(bookingId);
        int required = Math.max(1, b.getVehicleCount());
        if (currentRows.size() >= required) throw new IllegalStateException("All required safari teams are already assigned");

        User d = assignmentStrategyContext.select("MANUAL", users.findByRole(Role.JEEP_DRIVER), r.driverId());
        User g = assignmentStrategyContext.select("MANUAL", users.findByRole(Role.SAFARI_GUIDE), r.guideId());
        if (d.getRole() != Role.JEEP_DRIVER || g.getRole() != Role.SAFARI_GUIDE)
            throw new IllegalArgumentException("Driver/Guide role mismatch");
        if (!d.isAvailable() || d.isOnLeave()) throw new IllegalStateException("Driver is not available");
        if (!g.isAvailable() || g.isOnLeave()) throw new IllegalStateException("Guide is not available");

        LocalDate date = b.getVisitDate();
        if(!leaveRequests.findApprovedForDate(d.getId(),date).isEmpty()) throw new IllegalStateException("This driver has approved leave on "+date);
        if(!leaveRequests.findApprovedForDate(g.getId(),date).isEmpty()) throw new IllegalStateException("This safari guide has approved leave on "+date);

        List<GuideRoster> rosterRows = guideRosters.findByGuideIdAndRosterDate(g.getId(), date);
        if (!rosterRows.isEmpty() && rosterRows.stream().noneMatch(GuideRoster::isAvailable))
            throw new IllegalStateException("This guide is unavailable in the roster for " + date);

        Vehicle v = vehicles.findFirstByDriverId(d.getId())
                .orElseThrow(() -> new IllegalStateException("The selected driver does not have a vehicle assigned by the System Administrator"));
        if (v.getStatus() == VehicleStatus.MAINTENANCE || v.getStatus() == VehicleStatus.INACTIVE)
            throw new IllegalStateException("The vehicle linked to this driver is not available for safari operations");

        int remaining = Math.max(1, b.getVisitorCount() - (currentRows.size() * 6));
        int seatsNeeded = Math.min(6, remaining);
        if (v.getCapacity() < seatsNeeded)
            throw new IllegalStateException("The driver's vehicle needs at least " + seatsNeeded + " passenger seats for the remaining group");

        for (TripAssignment x : currentRows) {
            if (x.getVehicle().getId().equals(v.getId())) throw new IllegalStateException("This driver's vehicle is already assigned to this booking");
            if (x.getDriver().getId().equals(d.getId())) throw new IllegalStateException("This driver is already assigned to this booking");
            if (x.getGuide().getId().equals(g.getId())) throw new IllegalStateException("This guide is already assigned to this booking");
        }

        for (TripAssignment x : assignments.findAll()) {
            if (x.getStatus() == AssignmentStatus.CANCELLED || x.getStatus() == AssignmentStatus.DECLINED) continue;
            if (!x.getBooking().getVisitDate().equals(date)) continue;
            if (x.getVehicle().getId().equals(v.getId())) throw new IllegalStateException("The vehicle linked to this driver is already assigned to another safari on " + date);
            if (x.getDriver().getId().equals(d.getId())) throw new IllegalStateException("This driver is already assigned to another safari on " + date);
            if (x.getGuide().getId().equals(g.getId())) throw new IllegalStateException("This safari guide is already assigned to another safari on " + date);
        }

        TripAssignment ta = new TripAssignment();ta.setBooking(b);ta.setVehicle(v);ta.setDriver(d);ta.setGuide(g);ta.setStatus(AssignmentStatus.ASSIGNED);assignments.save(ta);
        v.setStatus(VehicleStatus.ASSIGNED);vehicles.save(v);
        User sender=current.get(a);
        notifications.send(d,sender,"New safari assignment",b.getBookingCode()+" • "+b.getSafariPackage().getName()+" • "+date+" • vehicle "+v.getRegistrationNo(),"TRIP_ASSIGNMENT");
        notifications.send(g,sender,"New safari assignment",b.getBookingCode()+" • "+b.getSafariPackage().getName()+" • "+date+" • vehicle "+v.getRegistrationNo(),"TRIP_ASSIGNMENT");
        notifications.send(b.getTourist(),sender,"Safari team assigned","A safari team has been assigned to "+b.getBookingCode()+". Driver: "+d.getFullName()+", Guide: "+g.getFullName()+", Vehicle: "+v.getRegistrationNo()+".","TRIP_ASSIGNMENT");
        audit.log(a.getName(), "TRIP_ASSIGNMENT", b.getBookingCode() + " / team " + (currentRows.size()+1) + " of " + required + " / driver " + d.getFullName() + " / vehicle " + v.getRegistrationNo());
        ta.setPermit(permits.findByBookingId(b.getId()).orElse(null));return ta;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SAFARI_OPERATOR','SAFARI_GUIDE','JEEP_DRIVER','SYSTEM_ADMIN')")
    public TripAssignment status(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication a){
        TripAssignment ta=assignments.findById(id).orElseThrow(()->new IllegalArgumentException("Assignment not found"));
        boolean manager=a.getAuthorities().stream().anyMatch(x->x.getAuthority().equals("ROLE_SAFARI_OPERATOR")||x.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
        boolean assignedDriver=ta.getDriver().getEmail().equalsIgnoreCase(a.getName());
        boolean assignedGuide=ta.getGuide().getEmail().equalsIgnoreCase(a.getName());
        if(!manager&&!assignedDriver&&!assignedGuide)throw new IllegalArgumentException("You cannot update this assignment");
        AssignmentStatus s=AssignmentStatus.valueOf(body.getOrDefault("status","ASSIGNED").toUpperCase(Locale.ROOT));

        if(s==AssignmentStatus.COMPLETED){
            if(!assignedDriver) throw new IllegalStateException("Only the assigned driver can manually complete the trip after Park Officer checkout.");
            Permit permit=permits.findByBookingId(ta.getBooking().getId()).orElseThrow(()->new IllegalStateException("Digital permit record is missing"));
            if(permit.getCheckedOutAt()==null || permit.getStatus()!=PermitStatus.COMPLETED)
                throw new IllegalStateException("Waiting for Park Officer checkout.");
        }

        ta.setStatus(s);assignments.save(ta);
        if(s==AssignmentStatus.COMPLETED||s==AssignmentStatus.CANCELLED){
            Vehicle v=ta.getVehicle();
            boolean vehicleStillReserved=assignments.findAll().stream().anyMatch(x->!x.getId().equals(ta.getId())&&x.getVehicle().getId().equals(v.getId())&&!List.of(AssignmentStatus.CANCELLED,AssignmentStatus.DECLINED,AssignmentStatus.COMPLETED).contains(x.getStatus()));
            if(!vehicleStillReserved && v.getStatus()==VehicleStatus.ASSIGNED){v.setStatus(VehicleStatus.AVAILABLE);vehicles.save(v);}
            if(s==AssignmentStatus.COMPLETED){
                Booking b=ta.getBooking();
                boolean allDone=assignments.findByBookingIdOrderByIdAsc(b.getId()).stream().allMatch(x->x.getStatus()==AssignmentStatus.COMPLETED);
                if(allDone){b.setBookingStatus(BookingStatus.COMPLETED);bookings.save(b);notifications.send(b.getTourist(),ta.getDriver(),"Safari trip completed",b.getBookingCode()+" has been completed after gate checkout. You can now submit a verified review.","TRIP_COMPLETED");notifications.sendToOperators(ta.getDriver(),"Safari trip completed",b.getBookingCode()+" was completed by the assigned driver after Park Officer checkout.","TRIP_COMPLETED");}
            }
        }
        audit.log(a.getName(),"ASSIGNMENT_STATUS",ta.getBooking().getBookingCode()+" -> "+s);ta.setPermit(permits.findByBookingId(ta.getBooking().getId()).orElse(null));return ta;
    }
}
