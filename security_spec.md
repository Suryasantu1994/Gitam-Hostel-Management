# Security Specification - Hostel Management App

## Data Invariants
1. **Check-in Records**:
   - Must contain valid arrays for student data (names, IDs, etc.).
   - `updatedAt` must be a valid server timestamp or string matching ISO8601.
2. **Historical Records**:
   - Immutable once created (except by admin if applicable).
   - Must contain all required student and building context.

## Identity & Roles
- **Admins**: The owner (user who sets up the app) is an admin.
- **Authenticated Users**: Can read all data and perform check-ins.
- **Unauthenticated Users**: No access to data.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **P1 (Identity Spoofing)**: Attempting to create a check-in with a fake owner field (if implemented).
2. **P2 (State Shortcutting)**: Attempting to update `updatedAt` to a future date bypass.
3. **P3 (PII Leak)**: Unauthenticated user attempting to list the `history` collection.
4. **P4 (Resource Poisoning)**: Injecting 1MB string into a student name.
5. **P5 (Type Mismatch)**: Sending a string instead of an array for `studentIds`.
6. **P6 (Missing Fields)**: Creating a `CheckInRecord` without `buildingId`.
7. **P7 (Ghost Field)**: Adding `isVerifiedAdmin: true` to a student record.
8. **P8 (ID Injection)**: Using a malicious ID string for a historical record.
9. **P9 (Bulk Deletion)**: Unauthenticated user attempting to delete all historical records.
10. **P10 (Array Overflow)**: Sending an array of 10,000 student names to exhaust resources.
11. **P11 (Historical Mutation)**: Attempting to change the `studentId` of an existing historical record.
12. **P12 (Cross-Tenant Write)**: Writing to a check-in ID that belongs to another building's convention.

## Red Team Strategy
- Ensure `allow list` explicitly checks `request.auth != null`.
- Validate all incoming data shapes using `isValid` helpers.
- Use `affectedKeys().hasOnly()` for targeted updates.
