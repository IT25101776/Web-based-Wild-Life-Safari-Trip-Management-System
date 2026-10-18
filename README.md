<p align="center">
  <img src="frontend/public/images/brand/safari-lanka-logo.png" alt="Safari Lanka Logo" width="720">
</p>

<h1 align="center">Safari Lanka</h1>

<p align="center">
  <strong>Web-Based Wildlife Safari Trip Management System</strong>
</p>

<p align="center">
  React 18 &bull; Spring Boot 3 &bull; Java 17 &bull; MySQL 8
</p>

<p align="center">
  <strong>SE2030 - Software Engineering | Year 2 Semester 1 | Group 01</strong><br>
  Sri Lanka Institute of Information Technology (SLIIT)
</p>

---

Safari Lanka is an academic, role-based Java web application prototype for managing wildlife safari trips and visitor operations at **Yala National Park, Sri Lanka**. It brings tourist bookings, safari package management, jeep and driver operations, safari guide rostering, payments, digital permits, park entry validation, compliance, notifications and administration into one central platform.

> **Academic-use notice:** Safari Lanka is a university prototype. It is not an official Department of Wildlife Conservation (DWC) system and must not be represented as an official Yala National Park service.

## Contents

- [Project Team](#project-team)
- [Core Modules](#core-modules)
- [Technology Stack](#technology-stack)
- [Major Users and Roles](#major-users-and-roles)
- [System Workflow](#system-workflow)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Running the Project](#running-the-project)
- [Database](#database)
- [Project Structure](#project-structure)
- [Security](#security)
- [Project Limitations](#project-limitations)
- [Contributing](#contributing)

## Project Team

| IT Number | Member | Major Function |
|---|---|---|
| IT25102346 | Malintha K.K.I | Tourist Booking, Visitor Group & Permit Application Management |
| IT25100233 | Senanayake S.M.K.D | Safari Package, Route, Time Slot & Pricing Management |
| IT25100295 | Somarathne R.N.N | Jeep Driver & Vehicle Maintenance Management |
| IT25101776 | Weerakkody W.W.M.B | Safari Guide Roster & Trip Assignment Management |
| IT25100854 | Thennakoon T.M.A.N | Payment, Invoice, Cancellation & Refund Management |
| IT25104064 | Hettiarachchi H.A.A.S | Park Entry, Digital Permit Validation & Safari Compliance Management |

## Core Modules

### 1. Tourist Booking, Visitor Group & Permit Application Management
Manages safari bookings, visitor groups, participant details, booking status and permit applications.

### 2. Safari Package, Route, Time Slot & Pricing Management
Manages safari packages, routes or zones, time slots, pricing rules, visitor capacity and package availability.

### 3. Jeep Driver & Vehicle Maintenance Management
Manages jeep owners, safari jeeps, drivers, maintenance records, vehicle availability and trip assignments while preventing scheduling conflicts.

### 4. Safari Guide Roster & Trip Assignment Management
Manages guide profiles, qualifications, languages, availability, leave, duty rosters and trip assignments while preventing overlapping schedules.

### 5. Payment, Invoice, Cancellation & Refund Management
Manages simulated booking payments, invoices, receipts, cancellation charges, refund requests and financial records.

### 6. Park Entry, Digital Permit Validation & Safari Compliance Management
Manages permit processing, QR-based digital permits, park entry validation, check-in/check-out and compliance records.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Java 17, Spring Boot 3 |
| Security | Spring Security, role-based access |
| Database | MySQL 8+ |
| Version Control | Git & GitHub |

## Major Users and Roles

- Tourist / Visitor Group Leader
- Reservation / Customer Service Officer
- Safari Operations Manager
- Jeep Owner / Fleet Manager
- Jeep Driver
- Safari Guide / Naturalist
- Finance Officer
- Authorised DWC Park / Gate Officer
- System Administrator

## System Workflow

```text
Safari Package
      ↓
Tourist Booking
      ↓
Visitor Group Details
      ↓
Booking Confirmation
      ↓
Payment
      ↓
Jeep & Driver Assignment
      ↓
Safari Guide Assignment
      ↓
Digital Permit Processing
      ↓
QR Permit Validation
      ↓
Park Check-In
      ↓
Safari Trip
      ↓
Park Check-Out
```

## Key Features

### Tourist and Booking
- Browse available safari packages
- Select available safari time slots
- Create and manage bookings
- Maintain visitor-group details
- Add emergency-contact and special-requirement information
- Track booking and permit status

### Safari Operations
- Create and manage safari packages
- Manage routes/zones and schedules
- Configure pricing and capacity
- Assign available jeeps and drivers
- Assign suitable safari guides
- Prevent overlapping resource assignments

### Jeep and Driver Management
- Jeep and driver records
- Vehicle availability
- Maintenance records
- Driver assignment management

### Safari Guide Management
- Guide profiles
- Qualifications and languages
- Availability and leave
- Duty rosters
- Safari trip assignments

### Payment and Finance
- Simulated payments
- Invoices and receipts
- Cancellation management
- Refund requests
- Financial records

### Digital Permit and Park Entry
- Permit application processing
- QR-based digital permits
- Permit validation
- Park check-in and check-out
- Compliance and incident records

### Shared Features
- Authentication and login/logout
- Role-Based Access Control
- User profiles
- Search and filtering
- Notifications
- Form validation
- Reports
- Responsive web interface

## Architecture

```text
Browser
   |
   v
React + Vite Frontend
   |
   | REST API
   v
Spring Boot Backend
   |
   v
Service / Business Logic
   |
   v
Persistence Layer
   |
   v
MySQL Database
```

## Prerequisites

Install the following tools before running Safari Lanka:

- Java JDK 17+
- Node.js and npm
- MySQL Server 8+
- Git

Check installed versions:

```bash
java -version
node --version
npm --version
mysql --version
git --version
```

## Running the Project

For the Windows development environment, use the project launcher from the repository root when available:

```bat
run.bat
```

The React/Vite development application is normally accessed through the local development server configured by the project.

## Database

Safari Lanka uses a central MySQL database to store application records including:

- users and roles;
- safari packages and schedules;
- bookings and visitor groups;
- jeep and driver records;
- guide profiles and assignments;
- payments and refunds;
- digital permits;
- park-entry and compliance records.

Do not commit real database credentials or sensitive production data to the repository.

## Project Structure

```text
Web-based-Wild-Life-Safari-Trip-Management-System/
|
|-- frontend/
|   |-- public/
|   |   `-- images/
|   |       `-- brand/
|   |           `-- safari-lanka-logo.png
|   `-- src/
|
|-- backend/
|-- database/
|-- README.md
|-- CONTRIBUTING.md
`-- run.bat
```

### README Logo Path

The Safari Lanka logo used at the top of this README is loaded directly from:

```text
frontend/public/images/brand/safari-lanka-logo.png
```

The logo filename and letter case must match the repository file exactly.

## Security

- Enforce authentication and role permissions on backend endpoints.
- Store passwords using secure one-way password hashing.
- Do not commit JWT secrets, database passwords, API keys or authentication tokens.
- Protect visitor, identification and financial information from unauthorised roles.
- Validate IDs, booking capacity, resource availability and workflow transitions on the backend.
- Do not use real payment credentials with the academic payment simulation.

## Project Limitations

- Safari Lanka is an academic Java web prototype.
- The project focuses on the Yala National Park safari context.
- The system is not an official Department of Wildlife Conservation application.
- The system does not directly connect to government databases.
- Payment processing is simulated for academic purposes.
- QR scanning depends on compatible browsers, devices and camera permissions.
- Prototype permits and financial documents do not replace official documents.

## Contributing

Development workflow, coding standards, Git practices, testing expectations, security requirements and the Definition of Done are available in [CONTRIBUTING.md](CONTRIBUTING.md).

---

<p align="center">
  <strong>Safari Lanka - Web-Based Wildlife Safari Trip Management System</strong><br>
  SE2030 Software Engineering &bull; Year 2 Semester 1 &bull; Group 01<br>
  Sri Lanka Institute of Information Technology
</p>
