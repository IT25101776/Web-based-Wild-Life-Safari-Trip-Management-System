# Safari Lanka

## Web Based Wildlife Safari Trip Management System

**SE2030 - Software Engineering | Year 2, Semester 1 | Group 01**  
**Sri Lanka Institute of Information Technology (SLIIT)**

Safari Lanka is an academic, role-based Java web application prototype for managing wildlife safari trips and visitor operations in **Yala National Park, Sri Lanka**. It connects tourist booking, safari package management, fleet and driver operations, guide rostering, payments, permits, park entry/compliance, notifications and administration through one central platform.

> **Academic-use notice:** Safari Lanka is a university prototype. It is not an official Department of Wildlife Conservation (DWC) system and must not be represented as an official Yala National Park service. Payments and GPS behaviour used by the project are simulated/demo workflows.

---

## Contents

- [Project Team](#project-team)
- [Core Modules](#core-modules)
- [Current Technology Stack](#current-technology-stack)
- [Major Users and Roles](#major-users-and-roles)
- [End-to-End Workflow](#end-to-end-workflow)
- [Important Business Rules](#important-business-rules)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Run on Windows](#run-on-windows)
- [Database Setup](#database-setup)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [Development and Testing](#development-and-testing)
- [Security and Privacy Notes](#security-and-privacy-notes)
- [Known Scope and Limitations](#known-scope-and-limitations)
- [Contributing](#contributing)

---

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

### 1. Tourist Booking, Visitor Group & Permit Application
Tourists can browse safari packages, select valid dates, create bookings, provide visitor counts/contact details and special requirements, and progress towards permit processing.

### 2. Safari Package, Route, Time Slot & Pricing
Safari Operations manages packages, schedules, routes/zones, pricing, capacities, media and availability.

### 3. Jeep Driver & Vehicle Maintenance
Manages vehicles, drivers, vehicle availability, maintenance history and trip-related resource allocation while preventing invalid/conflicting assignments.

### 4. Safari Guide Roster & Trip Assignment
Manages guide profiles, qualifications, languages, availability, leave, rosters and trip assignments while preventing overlapping schedules.

### 5. Payment, Invoice, Cancellation & Refund
Supports academic/demo card payments and bank-transfer workflows, Finance review, invoices/receipts and refund-related records.

### 6. Park Entry, Digital Permit Validation & Safari Compliance
Supports permit review/issue, QR-based validation, park check-in/check-out, compliance records and related audit history.

## Current Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Java 17, Spring Boot 3.4.x, Spring Web, Spring Security, validation |
| Authentication | JWT-based role authentication/authorisation |
| Data Access | Spring Data JPA / Hibernate |
| Database | MySQL 8+ (`safari_lanka`) |
| Development launcher | Root npm scripts and Windows `.bat` launchers |

## Major Users and Roles

- Tourist / Visitor
- Safari Operations Manager
- Safari Guide / Naturalist
- Jeep Driver
- Authorised Park / Gate Officer
- Finance & Administration Manager
- System Administrator

Role-based access separates public/tourist functionality from operational, finance, park and administration dashboards.

## End-to-End Workflow

A typical fully completed safari passes through the following stages:

```text
Public package discovery
        ↓
Tourist registration / sign-in
        ↓
Create booking (PENDING / UNPAID)
        ↓
Safari Operations confirms booking
        ↓
Tourist payment
   ├── Demo card -> PAID
   └── Bank transfer -> Finance review -> PAID when approved
        ↓
Safari Operations assigns available driver/vehicle and guide
        ↓
Park/Gate Officer reviews and issues permit
        ↓
Park/Gate Officer validates check-in
        ↓
Safari trip is ongoing
        ↓
Park/Gate Officer records check-out
        ↓
Driver manually completes the trip
        ↓
Tourist can submit a post-trip review
```

## Important Business Rules

- Safari date must be after the current day; same-day bookings are rejected.
- The project uses a maximum of **6 visitors per vehicle**.
- Adults and children aged 5-11 are chargeable at the package per-person rate.
- Children below 5 do not add the package per-person charge, but still count towards vehicle capacity.
- Tourists cannot pay while a booking is still pending Operations confirmation.
- Bank transfers require Finance approval before they become paid.
- Resource assignment occurs only after successful/approved payment.
- Assignment must respect resource conflicts and approved guide/driver leave.
- Permit review/issue requires the booking/payment/assignment prerequisites used by the workflow.
- Park check-in starts the ongoing trip state.
- The driver cannot manually complete the safari until Park Officer check-out has been recorded.
- Completed-trip review is available after successful trip completion.

## Key Features

### Tourist experience
- Public safari package discovery
- Tourist registration and profile management
- Booking creation and eligible booking editing
- Visitor categories: adults, children 5-11 and children below 5
- Special requirements and contact information
- Booking, payment, permit, team and trip-status visibility
- Completed-safari ratings/reviews

### Payments and finance
- Demo card-payment flow
- Bank-transfer slip workflow with Finance approval/rejection
- Payment state and financial records
- Invoice/receipt support
- Cancellation/refund-related workflows

> Never enter real card or banking credentials. This is an academic/demo payment environment.

### Safari operations
- Package and media management
- Booking confirmation/cancellation
- Guide, driver and vehicle assignment
- Conflict/leave checks
- Booking-summary printing
- Operational searches and incident visibility

### Fleet, guides and leave
- Vehicle records and driver links
- Vehicle maintenance reporting and history
- Guide rosters and availability
- Guide/driver leave requests with Admin decisions
- Approved-leave assignment blocking

### Permit and park operations
- Permit review, approval/issue or rejection
- QR-based digital permit workflow
- Check-in and check-out
- Park Compliance records
- Incident/compliance history

### Administration
- User/login/role management
- Vehicle/driver administration
- Leave decisions
- Booking, incident, contact, audit and system-setting views
- Theme-aware Yala GPS demonstration map

### User experience
- Responsive layouts
- Light/dark themes
- In-app notifications with unread counts
- Global action-result feedback
- Search capabilities in operational views
- Kavi floating safari assistant with project-specific quick actions

## Architecture

```text
Browser
  |
  v
React 18 + Vite
  |
  | REST / JSON (/api)
  v
Spring Boot 3 + Spring Security + JWT
  |
  v
Service / business-rule layer
  |
  v
Spring Data JPA / Hibernate
  |
  v
MySQL 8+
```

The application follows a layered approach, separating frontend UI, controllers/APIs, business logic, persistence and database responsibilities.

## Prerequisites

Install the following before running the project locally:

- Java JDK 17 or newer
- Node.js LTS with npm
- MySQL Server 8+
- Git, if cloning/version-controlling locally

Useful checks:

```bash
java -version
node --version
npm --version
mysql --version
```

## Run on Windows

The repository contains a one-click Windows development launcher.

1. Ensure MySQL Server is running.
2. Prepare/import the Safari Lanka database as described below.
3. From the project root, run:

```bat
run.bat
```

The launcher starts the backend and frontend, waits for the services to become ready, and opens the Vite application in the browser.

The standard local frontend URL documented by the project is:

```text
http://localhost:5173
```

## Database Setup

The main database is `safari_lanka`.

The current project documentation identifies the main SQL file as:

```text
database/SAFARI_LANKA_FULL.sql
```

A reset helper may also be present:

```text
database/RESET_safari_lanka.sql
```

For existing installations, use the upgrade SQL files included with the project only in their documented sequence. Back up important local data before applying reset or upgrade scripts.

### Local development database configuration

The supplied project documentation records the default local MySQL development login as `root` with password `1234`. Treat this as **demo/local configuration only**. Do not reuse these credentials in a real deployment and do not expose the database publicly.

## Demo Accounts

The project contains role-specific demo accounts for campus demonstration. For security, this README intentionally does not republish their plaintext passwords. Use the project-provided local demo data/configuration when demonstrating the system.

Available demo roles include:

- Tourist
- Safari Operator
- Safari Guide
- Jeep Driver
- Park Officer
- Finance Manager
- System Administrator

## Project Structure

The exact contents may evolve, but the current project documentation identifies a separated React frontend, Spring Boot backend and project database scripts. A typical repository layout is:

```text
Safari-Lanka/
├── frontend/              # React/Vite client
├── backend/               # Spring Boot API
├── database/              # Full/reset/upgrade SQL scripts
├── docs/                  # Project/report documentation where included
├── run.bat                # Windows one-click launcher
├── package.json           # Root development scripts where included
├── README.md
└── CONTRIBUTING.md
```

## Development and Testing

Before handing work to another team member:

1. Run the project from a clean local startup.
2. Exercise the role(s) affected by your change.
3. Verify validation and failure paths, not only the success path.
4. Check the cross-role workflow if your change impacts booking, payment, assignment, permit, check-in/check-out or completion.
5. Confirm responsive/light/dark UI behaviour where the change is visible.
6. Never commit generated build output, secrets or real credentials.

A particularly important acceptance path is:

```text
Booking -> Operations confirmation -> Payment -> Assignment
-> Permit -> Check-in -> Check-out -> Driver completion -> Review
```

## Security and Privacy Notes

- Authentication/authorisation rules must be enforced by the backend, not only hidden in the UI.
- Passwords should remain securely one-way hashed.
- Do not commit JWT secrets, real database credentials, card data or bank credentials.
- Never store full card numbers or CVV/CVC values for the demo flow.
- Personal and financial information should only be exposed to authorised roles.
- Validate identifiers, status transitions and ownership at the backend boundary.
- Keep MySQL private to the development/deployment environment rather than exposing it through demo tunnelling.

## Known Scope and Limitations

- This is an academic Java web application prototype.
- It targets the Yala National Park safari context rather than all Sri Lankan national parks.
- It is not an official DWC application and does not connect directly to government databases.
- Payments are simulated.
- The Admin GPS/map behaviour is suitable for a campus demonstration and is not real telematics.
- GPS/IoT hardware integration is outside the original project scope.
- QR scanning depends on browser/device camera support and permissions.
- Internet connectivity is required for centralised web operation.
- Prototype permits, invoices and receipts do not replace official documents.

## Contributing

Team development rules, Git workflow, coding expectations, secure-development rules, testing checklist and Definition of Done are maintained in [CONTRIBUTING.md](CONTRIBUTING.md).

---

### Academic Project

**Safari Lanka - Web Based Wildlife Safari Trip Management System**  
SE2030 Software Engineering, Year 2 Semester 1, Group 01, SLIIT.
