# System Design & Technical Decisions

This document details the core engineering decisions, edge cases, and tradeoffs made during the development of AgencyDesk. 

## Core Architecture
AgencyDesk operates on a classic SPA architecture utilizing Next.js for the client and FastAPI (Python) for the backend, backed by PostgreSQL. The primary architectural constraint is the requirement for a robust multi-tenant system within a single database instance.

## Edge Cases and Solutions

### 1. Cross-tenant Isolation
**The Problem**: In a single database multi-tenant architecture, data leakage is a critical vulnerability. Missing a `WHERE agency_id = X` clause could expose one agency's clients to another.

**The Solution**: Isolation is enforced at the router level by extracting the `agency_id` from the verified JWT (populated during login). Every endpoint requires `agency_id` as a path parameter, which is validated against the JWT. This guarantees that operations are intrinsically scoped to the authenticated tenant context. 

**Tradeoff**: Passing `agency_id` explicitly in every endpoint increases boilerplate, but relying on implicit context variables (like `ContextVar` in Python) obfuscates data flow and makes testing brittle. Explicit path parameters ensure the routing layer explicitly defines the tenant boundary.

### 2. Internal Content Filtering
**The Problem**: Agencies require the ability to collaborate privately on tasks, comments, and files before presenting them to clients. If filtering is handled client-side, the data is still transmitted over the network and can be intercepted.

**The Solution**: We utilize role-based query modification. If the authenticated user's role is `client_user`, the backend automatically appends a filter for `is_internal == False` before executing the database query.

**Tradeoff**: Query modification can lead to complex conditional logic. We opted for explicit `if membership.role == "client_user"` checks in the router rather than abstracting this into a generic repository layer. While this violates DRY slightly, it ensures that visibility logic is highly visible to developers reviewing the endpoint behavior, reducing the risk of accidental exposure during refactors.

### 3. One Person, Two Agencies
**The Problem**: A freelancer might work for "Agency A" as a member and "Agency B" as a client. If roles are tied directly to the `User` model, this poly-membership breaks down.

**The Solution**: We implement a normalized `Membership` model serving as a join table between `Users` and `Agencies`. The `role` and `client_id` (if applicable) are attributes of the `Membership`, not the `User`. The JWT payload embeds the specific `agency_id` and `role` for the active session.

**Tradeoff**: This requires users to log in specifically to a workspace (using `agency_slug`), meaning they cannot view an aggregate dashboard across all agencies. This simplifies authorization at the cost of a slightly more fragmented user experience for power users.

### 4. Invite Races and Idempotency
**The Problem**: Distributed systems can suffer from race conditions during invitations. A user might click an invite link twice, or an admin might send two invites. Attempting to insert duplicate memberships will cause database integrity errors.

**The Solution**: The invitation acceptance logic uses a check-and-set (upsert) pattern. We first query for an existing membership. If none exists, we insert. The database schema enforces a unique constraint on `(user_id, agency_id)` to catch race conditions at the lowest level.

**Tradeoff**: We use a Read-Modify-Write pattern in application code instead of a raw SQL `INSERT ... ON CONFLICT DO NOTHING`. The ORM approach is slower but allows us to reliably trigger application-level events (like sending welcome emails) based on whether the user was newly added.

### 5. Safe Assignee Removal
**The Problem**: When an employee leaves an agency or is removed from a project, they must be removed from the system. However, deleting their membership cannot cascade to delete the tasks they worked on, as this would destroy historical project data.

**The Solution**: We enforce `ON DELETE SET NULL` at the database level for the `assignee_membership_id` foreign key on the `tasks` table. Furthermore, the application logic for removing a member from a project explicitly unassigns them from all active tasks in that project.

**Tradeoff**: Setting fields to NULL means application code must always handle the `assignee == None` state. This is preferable to reassigning tasks to a "dummy" or "system" user, which pollutes reporting metrics.
