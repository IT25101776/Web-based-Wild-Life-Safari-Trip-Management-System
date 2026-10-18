package com.safarilanka.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
@Order(1)
public class DatabaseCompatibilityMigration implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    public DatabaseCompatibilityMigration(JdbcTemplate jdbc){this.jdbc=jdbc;}

    @Override public void run(String... args){
        try {
            List<String> indexes=jdbc.queryForList(
                "select distinct index_name from information_schema.statistics where table_schema=database() and table_name='trip_assignments' and column_name='booking_id' and non_unique=0 and index_name<>'PRIMARY'",
                String.class);
            for(String idx:indexes){
                String safe=idx.replace("`","``");
                jdbc.execute("alter table trip_assignments drop index `"+safe+"`");
            }
        } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set additional_vehicle_fee=price_per_person where additional_vehicle_fee is null"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/yala-dawn-leopard-quest.mp4' where name='Yala Dawn Leopard Quest' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/elephant-birdlife-explorer.mp4' where name='Elephant & Birdlife Explorer' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/golden-hour-sunset-safari.mp4' where name='Golden Hour Sunset Safari' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/wildlife-photography-drive.mp4' where name='Wildlife Photography Drive' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/family-discovery-safari.mp4' where name='Family Discovery Safari' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update safari_packages set video_url='/videos/packages/full-day-yala-explorer.mp4' where name='Full-Day Yala Explorer' and (video_url is null or video_url='')"); } catch(Exception ignored) {}
        try { jdbc.update("update bookings set vehicle_count=ceil(visitor_count/6.0) where vehicle_count is null or vehicle_count<1"); } catch(Exception ignored) {}
        try { jdbc.update("update bookings set vehicle_surcharge=0 where vehicle_surcharge is null"); } catch(Exception ignored) {}
        ensureColumn("permits","decision_by_email","VARCHAR(255) NULL");
        ensureColumn("permits","decision_by_name","VARCHAR(255) NULL");
        ensureColumn("permits","decision_by_role","VARCHAR(80) NULL");
        ensureColumn("permits","checked_in_by_email","VARCHAR(255) NULL");
        ensureColumn("permits","checked_out_by_email","VARCHAR(255) NULL");
        ensureColumn("bookings","cancellation_reason","VARCHAR(1000) NULL");
        ensureColumn("payments","rejection_reason","VARCHAR(1000) NULL");
        ensureColumn("users","archived","TINYINT(1) NOT NULL DEFAULT 0");
        ensureColumn("users","archived_at","DATETIME(6) NULL");
        createCrudTables();
        ensureAccountChangeTable();
        ensureSetting("chatbot.enabled","true","Tourist Kavi chatbot feature flag controlled by System Administration");
        recreateRefundStatusCheck();
        recreatePaymentStatusCheck("bookings", "chk_booking_payment_status", "payment_status");
        recreatePaymentStatusCheck("payments", "chk_payment_status", "status");
    }

    private void ensureColumn(String table,String column,String definition){
        try {
            Integer n=jdbc.queryForObject("select count(*) from information_schema.columns where table_schema=database() and table_name=? and column_name=?",Integer.class,table,column);
            if(n!=null&&n==0) jdbc.execute("alter table `"+table+"` add column `"+column+"` "+definition);
        } catch(Exception ignored) {}
    }


    private void createCrudTables(){
        try { jdbc.execute("""
            create table if not exists guide_rosters (
              id bigint not null auto_increment,
              guide_id bigint not null,
              roster_date date not null,
              shift varchar(30) not null,
              available tinyint(1) not null default 1,
              notes varchar(500) null,
              created_at datetime(6) not null default current_timestamp(6),
              updated_at datetime(6) null,
              primary key (id),
              constraint uk_guide_roster_slot unique (guide_id,roster_date,shift),
              constraint fk_guide_roster_guide foreign key (guide_id) references users(id) on update cascade on delete restrict
            ) engine=InnoDB
        """); } catch(Exception ignored) {}
        try { jdbc.execute("""
            create table if not exists gate_compliance_records (
              id bigint not null auto_increment,
              permit_id bigint not null,
              officer_id bigint not null,
              gate_name varchar(255) not null,
              vehicle_registration varchar(255) null,
              inspection_date datetime(6) not null default current_timestamp(6),
              permit_verified tinyint(1) not null default 0,
              visitor_count_verified tinyint(1) not null default 0,
              vehicle_verified tinyint(1) not null default 0,
              guide_verified tinyint(1) not null default 0,
              driver_verified tinyint(1) not null default 0,
              compliance_status varchar(30) not null default 'PENDING',
              record_status varchar(20) not null default 'DRAFT',
              notes varchar(1500) null,
              created_at datetime(6) not null default current_timestamp(6),
              updated_at datetime(6) null,
              primary key (id),
              constraint fk_gate_compliance_permit foreign key (permit_id) references permits(id) on update cascade on delete restrict,
              constraint fk_gate_compliance_officer foreign key (officer_id) references users(id) on update cascade on delete restrict
            ) engine=InnoDB
        """); } catch(Exception ignored) {}
    }

    private void ensureAccountChangeTable(){
        try { jdbc.execute("""
            create table if not exists account_change_requests (
              id bigint not null auto_increment,
              requester_id bigint not null,
              current_full_name varchar(255) not null,
              current_email varchar(255) not null,
              requested_full_name varchar(255) not null,
              requested_email varchar(255) not null,
              status varchar(30) not null default 'PENDING',
              admin_note varchar(1000) null,
              reviewed_by_email varchar(255) null,
              reviewed_at datetime(6) null,
              created_at datetime(6) not null default current_timestamp(6),
              primary key (id),
              constraint fk_account_change_requester foreign key (requester_id) references users(id) on update cascade on delete cascade
            ) engine=InnoDB
        """); } catch(Exception ignored) {}
    }

    private void ensureSetting(String key,String value,String description){
        try {
            Integer count=jdbc.queryForObject("select count(*) from system_settings where setting_key=?",Integer.class,key);
            if(count!=null&&count==0) jdbc.update("insert into system_settings(setting_key,setting_value,description) values(?,?,?)",key,value,description);
        } catch(Exception ignored) {}
    }

    private void recreateRefundStatusCheck(){
        try {
            List<String> checks=jdbc.queryForList(
                "select constraint_name from information_schema.table_constraints where table_schema=database() and table_name='refund_requests' and constraint_type='CHECK' and constraint_name='chk_refund_status'",
                String.class);
            for(String c:checks){String safe=c.replace("`","``");try{jdbc.execute("alter table refund_requests drop check `"+safe+"`");}catch(Exception e){try{jdbc.execute("alter table refund_requests drop constraint `"+safe+"`");}catch(Exception ignored){}}}
            jdbc.execute("alter table refund_requests add constraint chk_refund_status check (status in ('PENDING','APPROVED','REJECTED','PROCESSED','WITHDRAWN'))");
        } catch(Exception ignored) {}
    }

    private void recreatePaymentStatusCheck(String table, String preferredName, String column) {
        try {
            List<String> checks = jdbc.queryForList(
                    "select constraint_name from information_schema.table_constraints where table_schema=database() and table_name=? and constraint_type='CHECK' and constraint_name=?",
                    String.class, table, preferredName);
            for (String c : checks) {
                String safe=c.replace("`","``");
                try { jdbc.execute("alter table `"+table+"` drop check `"+safe+"`"); }
                catch (Exception e) { try { jdbc.execute("alter table `"+table+"` drop constraint `"+safe+"`"); } catch (Exception ignored) {} }
            }
            jdbc.execute("alter table `"+table+"` add constraint `"+preferredName+"` check (`"+column+"` in ('UNPAID','PENDING','PAID','REJECTED','FAILED','REFUNDED'))");
        } catch(Exception ignored) {}
    }
}
