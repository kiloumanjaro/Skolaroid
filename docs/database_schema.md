# Skolaroid Database Schema & Relationships (Complete Guide)

This document provides an exhaustive, plain-English breakdown of every table, relationship, and the technical behaviors that occur during **Deletions** and **Updates**.

---

## 1. Academic & Identity Core

### **User**

Represents a student or alumnus.

- **Reference**: Belongs to a **ProgramBatch** via `programBatchId`.
- **On Delete**: **RESTRICTED**. You cannot delete a **ProgramBatch** if users are still assigned to it.
- **On Update**: **CASCADE**. If a ProgramBatch ID changes, all associated users stay linked automatically.

### **Program**

A field of study (e.g., BSIT).

- **On Delete**: **CASCADE**. Deleting a Program removes all its **ProgramBatches**.
- **On Update**: **CASCADE**.

### **Batch**

A graduating year (e.g., 2024).

- **On Delete**: **CASCADE**. Deleting a Batch removes all its **ProgramBatches**.
- **On Update**: **CASCADE**.

### **ProgramBatch**

The junction between Program and Batch.

- **References**: `programId` and `batchId`.
- **On Delete**: **RESTRICTED**. You cannot delete this if it still has **Users** or **Memories**.
- **On Update**: **CASCADE**.

---

## 2. Social & Content Layer

### **Memory**

Posts or uploads.

- **References**:
  - **User** (`creatorId` - _Optional_): If a user is deleted, the memory stays but the creator field is set to **NULL**.
  - **Location** (`locationId`): **RESTRICTED**. Cannot delete a location if memories use it.
  - **ProgramBatch** (`programBatchId`): **RESTRICTED**.
  - **PrivateGroup** (`privateGroupId` - _Optional_): **RESTRICTED**. A group cannot be deleted if it has memories.
- **On Update**: **CASCADE** for all.

### **MemoryComment**

Replies to a memory.

- **References**: **User** (author) and **Memory**.
- **On Delete**: **CASCADE**. If the author is deleted OR the memory is deleted, the comment is wiped.
- **On Update**: **CASCADE**.

### **MemoryVote**

Upvotes.

- **References**: **User** and **Memory**.
- **On Delete**: **CASCADE**. If either the user or memory is gone, the vote is wiped.
- **On Update**: **CASCADE**.

### **Location**

Coordinates and building names.

- **On Delete**: **RESTRICTED**. Cannot delete if referenced by any memory.
- **On Update**: **CASCADE**.

### **Tag**

Labels (e.g., #Sports).

- **Relationship**: Many-to-Many with Memories.
- **Behavior**: Deleting a tag just unlinks it from memories; it doesn't delete the memories themselves.

---

## 3. Privacy & Groups

### **PrivateGroup**

Private sharing circles.

- **References**: **User** (creator - _Optional_).
- **On Delete**: **RESTRICTED**. Cannot delete if it still has **Memories**.
- **On Update**: **CASCADE**.

### **GroupMembership**

Links users to groups.

- **References**: **User** and **PrivateGroup**.
- **On Delete**: **CASCADE**. If the group is deleted OR the user is deleted, the membership record is gone.
- **On Update**: **CASCADE**.

### **Invitation**

Requests to join a group.

- **References**: **User** (inviter) and **PrivateGroup**.
- **On Delete**: **CASCADE**. If the inviter or group is gone, the invitation is canceled.
- **On Update**: **CASCADE**.

---

## 4. System & Moderation

### **Report**

Flags for problematic content.

- **References**:
  - **Memory**: **CASCADE**. If the memory is deleted, the report is gone.
  - **User** (reporter): **CASCADE**. If the reporter is deleted, the report is gone.
  - **User** (resolver - _Optional_): **RESTRICTED**. Cannot delete an admin who is currently assigned to resolve a report.
- **On Update**: **CASCADE**.

### **ModerationActionLog**

Audit trail of admin actions.

- **References**: **User** (admin), **Memory**, and **Report**.
- **On Delete**: **RESTRICTED**. Log records are preserved; you cannot delete the admin, memory, or report if they are part of a moderation history.
- **On Update**: **CASCADE**.

### **Notification**

User alerts.

- **References**:
  - **User**: **CASCADE**. If the user is deleted, their notifications are wiped.
  - **Memory/Report**: **RESTRICTED**. Cannot delete the memory/report if it's the target of a notification.
- **On Update**: **CASCADE**.

### **UploadRateLimit**

Spam prevention.

- **References**: **User** (via ID).
- **Behavior**: This is a standalone tracking table. Deleting a user doesn't automatically wipe these logs (they are usually cleaned up by time).

---

## Exhaustive Relationship & Conflict Summary

| Action                   | Resulting Impact on Related Data                                                                                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Delete Program/Batch** | Automatically deletes all **ProgramBatches**.                                                                                                                       |
| **Delete User**          | Wipes their **Comments**, **Votes**, **GroupMemberships**, **Invitations**, and **Notifications**. Their **Memories** stay but become "Anonymous" (Creator = Null). |
| **Delete Memory**        | Wipes all associated **Comments**, **Votes**, **Reports**, and **Notifications**.                                                                                   |
| **Delete PrivateGroup**  | Wipes all **Memberships** and **Invitations**. **RESTRICTED** if it still has memories.                                                                             |
| **Update ID (Any)**      | All referencing tables (Foreign Keys) are automatically updated (**CASCADE**) to maintain the link.                                                                 |
| **Delete Location**      | **RESTRICTED**. Must remove or move all memories from this location first.                                                                                          |
