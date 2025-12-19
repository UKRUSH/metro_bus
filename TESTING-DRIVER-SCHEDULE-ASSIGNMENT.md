# Quick Test Guide - Driver Schedule Assignment System

## Prerequisites
- Development server running on http://localhost:3000
- MongoDB connected
- At least one admin user
- At least one driver user
- Some buses and routes in the database

## Testing Steps

### 1. Test Driver Schedule Request Flow

**Step 1: Login as Driver**
- Navigate to http://localhost:3000/login
- Login with driver credentials
- Should redirect to http://localhost:3000/driver

**Step 2: Access Schedule Request Page**
- From driver dashboard, click "Request Schedule" card
- OR navigate directly to http://localhost:3000/driver/schedule-request
- Should see two tabs: "My Assignments" and "Request New Assignment"

**Step 3: Submit Assignment Request**
- Click "Request New Assignment" tab
- Select a date (today or future)
- Select an available bus from dropdown
- Select a route from dropdown
- Add optional notes (e.g., "Prefer morning shift")
- Click "Submit Assignment Request"
- Should see success message: "Assignment request submitted successfully!"
- Should auto-switch to "My Assignments" tab after 2 seconds

**Step 4: View Pending Request**
- In "My Assignments" tab, should see your request
- Status should show "PENDING" in yellow badge
- Should show message "⏳ Waiting for admin approval"
- Verify all details are correct (bus, route, date, notes)

### 2. Test Admin Approval Flow

**Step 1: Login as Admin**
- Logout driver
- Login with admin credentials
- Should redirect to http://localhost:3000/admin

**Step 2: Access Schedule Assignments**
- Click "Driver Assignments" card on admin dashboard
- OR navigate to http://localhost:3000/admin/schedule-assignments
- Should see list of all assignment requests
- Header should show "X Pending Approval" if there are pending requests

**Step 3: Review Request**
- Find the driver's request in the list
- Verify it shows:
  - Driver name and license number
  - "DRIVER REQUEST" purple badge
  - Bus and route details
  - Driver's notes
  - "PENDING" status

**Step 4: Approve Request**
- Click "✓ Approve" button
- Confirmation modal appears
- Click "Approve" in modal
- Should see success alert
- Status should change to "APPROVED" (green badge)
- "Approve" and "Reject" buttons should disappear

### 3. Test Rejection Flow

**Step 1: Driver Submits Another Request**
- Login as driver
- Go to schedule request page
- Submit another request for a different date

**Step 2: Admin Rejects**
- Login as admin
- Go to schedule assignments page
- Click "✗ Reject" button on the new request
- Modal appears asking for rejection reason
- Enter reason (e.g., "Bus under maintenance on this date")
- Click "Reject"
- Status changes to "REJECTED" (red badge)

**Step 3: Driver Views Rejection**
- Login as driver
- Go to "My Assignments"
- Should see rejected assignment with:
  - "REJECTED" status
  - Rejection reason in red box
  - Can submit new request

### 4. Test Validation

**Test 1: Double Booking Prevention**
- Driver submits request for Bus A on Date X
- Try submitting another request for any bus on Date X
- Should get error: "You already have an assignment for this date"

**Test 2: Bus Availability**
- Admin approves request for Bus A on Date X
- Another driver tries to request Bus A on Date X
- Should not see Bus A in available buses dropdown

**Test 3: Past Date Prevention**
- Try selecting a date in the past
- Date picker should prevent selection

### 5. Test Filters (Admin)

**Test Status Filter:**
- Change "Filter by Status" dropdown to "Pending"
- Should only show pending requests
- Try "Approved", "Rejected" - should filter correctly

**Test Date Filter:**
- Select a specific date
- Should only show assignments for that date
- Click "Clear Filters" - should reset

### 6. Expected Behavior Summary

**Driver Side:**
✅ Can request bus/route assignments
✅ Can view all their requests (pending, approved, rejected)
✅ Cannot request multiple assignments for same date
✅ Cannot select buses already assigned to others
✅ See rejection reasons when request is rejected
✅ Real-time availability checking

**Admin Side:**
✅ See all assignment requests from all drivers
✅ Can filter by status and date
✅ Can approve pending requests
✅ Can reject with mandatory reason
✅ Cannot approve/reject already processed requests
✅ Pending count shown in header

## Common Issues & Solutions

### Issue: No buses showing in dropdown
**Solution:** 
- Check if buses exist in database
- Check if buses have `approvalStatus: 'approved'`
- Check if buses have `currentStatus: 'available' or 'in-service'`

### Issue: Cannot submit request
**Solution:**
- Check browser console for errors
- Verify all required fields are filled
- Check MongoDB connection
- Verify authentication token is valid

### Issue: Assignment not showing on driver schedule
**Solution:**
- This implementation creates separate assignments
- Need to integrate with original `/driver/schedule` page
- Or use `/driver/schedule-request` as main schedule page

## API Endpoints for Testing

```bash
# Get driver's assignments
GET http://localhost:3000/api/drivers/schedule-assignments
Authorization: Bearer <driver-token>

# Get all assignments (admin)
GET http://localhost:3000/api/drivers/schedule-assignments?status=pending
Authorization: Bearer <admin-token>

# Create assignment request
POST http://localhost:3000/api/drivers/schedule-assignments
Authorization: Bearer <driver-token>
Content-Type: application/json
{
  "busId": "bus_id_here",
  "routeId": "route_id_here",
  "assignmentDate": "2025-12-20",
  "notes": "Optional notes"
}

# Approve assignment (admin)
PATCH http://localhost:3000/api/drivers/schedule-assignments/<assignment_id>
Authorization: Bearer <admin-token>
Content-Type: application/json
{
  "action": "approve"
}

# Reject assignment (admin)
PATCH http://localhost:3000/api/drivers/schedule-assignments/<assignment_id>
Authorization: Bearer <admin-token>
Content-Type: application/json
{
  "action": "reject",
  "rejectionReason": "Reason here"
}

# Get available buses and routes
GET http://localhost:3000/api/drivers/available-assignments?date=2025-12-20
Authorization: Bearer <driver-token>
```

## Success Criteria

- [x] Driver can submit assignment request
- [x] Driver can view all their requests
- [x] Driver sees pending/approved/rejected statuses
- [x] Admin sees all requests with driver details
- [x] Admin can approve requests
- [x] Admin can reject with reason
- [x] Validation prevents double-booking
- [x] Validation prevents past date selection
- [x] Filters work correctly
- [x] Navigation cards added to dashboards
- [x] Real-time availability checking

## Next Steps After Testing

1. Integrate with original schedule page if needed
2. Add email/SMS notifications
3. Add statistics dashboard
4. Add bulk approval feature
5. Add assignment history
6. Add export functionality
