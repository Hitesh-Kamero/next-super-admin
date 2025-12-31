# How to Restore a Deleted Account in Super Admin Portal

## ✅ Account Restored Successfully!

The account `devhitesh384@gmail.com` has been restored and login is working.

## Step-by-Step Guide to Restore Accounts via Super Admin Portal

### Step 1: Navigate to Users Page
1. Open the Super Admin Portal in your browser
2. Navigate to **Users** page (`/users`)
   - You can access it from the main navigation menu

### Step 2: Search for the Deleted User
1. In the search box at the top, enter:
   - **User ID** (e.g., `devhitesh384@gmail.com`)
   - **Email address**
   - **Mobile number**
2. Click the **Search** button (🔍) or press **Enter**

### Step 3: Identify Deleted Account
When a user account is deleted, you'll see:
- **Red "Account Deleted" badge** next to the user's name
- **"Account Status: Deleted"** section showing:
  - Deletion status badge
  - Deletion timestamp (e.g., "Deleted at: 2025-12-29 16:43:32")

### Step 4: Click Restore Account Button

**On Desktop:**
- Look for the **"Restore Account"** button (🔄 icon) next to "Edit User" button
- Located in the top-right area of the user details card
- Button text: "Restore Account" with rotate icon

**On Mobile:**
- Look for the small **rotate icon button** (🔄) in the top-right corner
- Next to the Edit (✏️) and Login (🔑) buttons

### Step 5: Restore Dialog
A dialog will open with:
- **Title:** "Restore Deleted Account"
- **Description:** Shows which account will be restored
- **Reason field (Optional):** Text area to enter restoration reason
- **Account deleted at:** Shows when the account was deleted
- **Buttons:**
  - **Cancel** - Closes dialog without restoring
  - **Restore Account** - Confirms and restores the account

### Step 6: Confirm Restoration
1. (Optional) Enter a reason for restoration
2. Click **"Restore Account"** button
3. You'll see a success toast: **"Account restored successfully"**
4. The user data will automatically refresh

### Step 7: Verify Restoration
After restoration:
- ✅ **"Account Deleted" badge disappears**
- ✅ **"Restore Account" button is hidden** (no longer needed)
- ✅ **User can now log in** with their credentials

## Visual Guide

### Desktop Layout
```
┌─────────────────────────────────────────────────────┐
│  User Search                                         │
│  [Search box] [🔍 Search]                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  John Doe [Account Deleted]                         │
│                                                      │
│  [Edit User] [🔄 Restore Account] [🔑 Login as User]│
│                                                      │
│  Account Information:                               │
│  • Account Status: [Deleted]                        │
│  • Deleted at: 2025-12-29 16:43:32                 │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ User Search              │
│ [Search] [🔍]            │
└─────────────────────────┘

┌─────────────────────────┐
│ John Doe [Deleted]      │
│ [✏️] [🔄] [🔑]          │
│                         │
│ Account Status:         │
│ [Deleted]              │
│ Deleted at: ...        │
└─────────────────────────┘
```

### Restore Dialog
```
┌─────────────────────────────────────┐
│  🔄 Restore Deleted Account         │
│                                     │
│  This will restore the account for │
│  devhitesh384@gmail.com             │
│                                     │
│  Reason (Optional):                 │
│  [Text area...]                     │
│                                     │
│  Account deleted at:                │
│  2025-12-29 16:43:32                │
│                                     │
│  [Cancel] [🔄 Restore Account]      │
└─────────────────────────────────────┘
```

## Code Implementation

The restore functionality is implemented in:

### Frontend Files:
- **`components/user-restore-dialog.tsx`** - Restore dialog component
- **`lib/users-api.ts`** - API client with `restoreUserAccount()` function
- **`app/(protected)/users/page.tsx`** - Users page with restore button

### Key Code Snippet:
```typescript
// The restore button appears conditionally
{user.isAccountSelfDeleted && (
  <Button
    variant="outline"
    onClick={() => setRestoreDialogOpen(true)}
    className="text-orange-600 hover:text-orange-700"
  >
    <RotateCcw className="h-4 w-4 mr-2" />
    Restore Account
  </Button>
)}
```

## API Details

### Endpoint
- **URL:** `POST /v1/admin/users/restore`
- **Authentication:** Firebase Admin Token (via `X-Firebase-Auth` header)
- **Request Body:**
  ```json
  {
    "userID": "devhitesh384@gmail.com",
    "reason": "Optional reason for restoration"
  }
  ```

### Response
```json
{
  "success": true,
  "userId": "u:devhitesh384@gmail.com",
  "message": "Account restored successfully",
  "restoredAt": "2025-12-29T16:45:55.547+05:30"
}
```

## What Happens During Restoration

1. ✅ Backend recalculates document ID using `GetUserDocId(user.UserId)`
2. ✅ Removes `isAccountSelfDeleted` and `accountSelfDeletedAt` fields
3. ✅ Logs restoration in audit log
4. ✅ Returns success response
5. ✅ Frontend refreshes user data automatically

## Troubleshooting

### Restore Button Not Showing
- ✅ Check if `isAccountSelfDeleted: true` in user data
- ✅ Refresh the page to get latest data
- ✅ Check browser console for errors

### Restoration Fails
- ✅ Verify admin permissions (Firebase token)
- ✅ Check user ID format (email or userId)
- ✅ Check backend logs for errors

### User Still Can't Login
- ✅ Verify restoration succeeded (check user data)
- ✅ Ensure correct password is being used
- ✅ Check that `isAccountSelfDeleted` is removed from document

## Summary

✅ **Account restoration is fully functional in the Super Admin Portal!**

The restore button automatically appears when viewing a deleted account, making it easy for admins to restore accounts with just a few clicks.
