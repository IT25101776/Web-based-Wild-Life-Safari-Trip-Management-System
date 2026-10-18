package com.safarilanka.service;

import com.safarilanka.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AccountDeletionService {
    private final JdbcTemplate jdbc;
    public AccountDeletionService(JdbcTemplate jdbc){this.jdbc=jdbc;}

    @Transactional
    public Map<String,Object> permanentlyDelete(User user){
        Long userId=user.getId();
        String email=user.getEmail();
        int deletedBookings=0;

        List<Long> bookingIds=jdbc.queryForList("select id from bookings where tourist_id=?",Long.class,userId);
        for(Long bookingId:bookingIds){
            List<Long> vehicleIds=jdbc.queryForList("select vehicle_id from trip_assignments where booking_id=?",Long.class,bookingId);
            jdbc.update("delete gc from gate_compliance_records gc join permits p on p.id=gc.permit_id where p.booking_id=?",bookingId);
            jdbc.update("delete from refund_requests where booking_id=?",bookingId);
            jdbc.update("delete from incidents where booking_id=?",bookingId);
            jdbc.update("delete from trip_assignments where booking_id=?",bookingId);
            releaseVehicles(vehicleIds);
            jdbc.update("delete from reviews where booking_id=?",bookingId);
            jdbc.update("delete from payments where booking_id=?",bookingId);
            jdbc.update("delete from permits where booking_id=?",bookingId);
            jdbc.update("delete from visitors where booking_id=?",bookingId);
            deletedBookings+=jdbc.update("delete from bookings where id=?",bookingId);
        }

        List<Long> staffVehicleIds=jdbc.queryForList("select vehicle_id from trip_assignments where driver_id=? or guide_id=?",Long.class,userId,userId);
        jdbc.update("delete from trip_assignments where driver_id=? or guide_id=?",userId,userId);
        releaseVehicles(staffVehicleIds);

        jdbc.update("update vehicles set driver_id=null where driver_id=?",userId);
        jdbc.update("delete from guide_rosters where guide_id=?",userId);
        jdbc.update("delete from gate_compliance_records where officer_id=?",userId);
        jdbc.update("delete from incidents where reporter_id=?",userId);
        jdbc.update("delete from leave_requests where requester_id=?",userId);
        jdbc.update("delete from reviews where tourist_id=?",userId);
        jdbc.update("delete from account_change_requests where requester_id=?",userId);
        jdbc.update("delete from notifications where recipient_id=? or sender_id=?",userId,userId);

        // Historical records that only store an email string are cleared/deleted so the removed account is no longer identifiable there.
        jdbc.update("update leave_requests set reviewed_by_email=null where lower(reviewed_by_email)=lower(?)",email);
        jdbc.update("update payments set reviewed_by=null where lower(reviewed_by)=lower(?)",email);
        jdbc.update("update permits set decision_by_email=null,decision_by_name=null,decision_by_role=null where lower(decision_by_email)=lower(?)",email);
        jdbc.update("update permits set checked_in_by_email=null where lower(checked_in_by_email)=lower(?)",email);
        jdbc.update("update permits set checked_out_by_email=null where lower(checked_out_by_email)=lower(?)",email);
        jdbc.update("delete from contact_messages where lower(email)=lower(?)",email);
        jdbc.update("delete from audit_logs where lower(actor_email)=lower(?)",email);

        int deletedUsers=jdbc.update("delete from users where id=?",userId);
        if(deletedUsers!=1) throw new IllegalStateException("Permanent account deletion did not complete");

        Map<String,Object> result=new LinkedHashMap<>();
        result.put("message","Account permanently deleted. All database records owned by or directly linked to this account were removed.");
        result.put("deletedUserId",userId);
        result.put("deletedBookings",deletedBookings);
        return result;
    }

    private void releaseVehicles(List<Long> vehicleIds){
        for(Long vehicleId:new LinkedHashSet<>(vehicleIds)){
            Long remaining=jdbc.queryForObject("select count(*) from trip_assignments where vehicle_id=? and status not in ('COMPLETED','CANCELLED')",Long.class,vehicleId);
            if(remaining!=null&&remaining==0) jdbc.update("update vehicles set status='AVAILABLE' where id=? and status='ASSIGNED'",vehicleId);
        }
    }
}
