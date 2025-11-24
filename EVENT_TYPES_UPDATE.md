# Event Types Feature - AI Recommendation Enhancement

## Overview
Event types have been added to improve AI recommendations. Admins must now select an event type when creating events, and the AI uses this information to recommend events based on users' type preferences.

## Event Type Categories
The following event types are available:
1. **Mass** - Church services and masses
2. **Prayer** - Prayer meetings and devotional events
3. **Social** - Social gatherings, fellowships, community events
4. **Educational** - Bible studies, workshops, classes
5. **Charity** - Charitable activities, outreach programs
6. **Youth** - Youth group events and activities
7. **Music** - Choir, concerts, music events
8. **Retreat** - Spiritual retreats and conferences
9. **Other** - Any event that doesn't fit above categories

## Changes Made

### 1. Database Schema (`server/models/ChurchsCredential.js`)
- Added `type` field to Event schema
- Made it **required** with validation
- Accepts only the 9 predefined categories
- Defaults to 'Other' if not specified

```javascript
type: { 
  type: String, 
  required: true,
  enum: ['Mass', 'Prayer', 'Social', 'Educational', 'Charity', 'Youth', 'Music', 'Retreat', 'Other'],
  default: 'Other'
}
```

### 2. Backend API (`server/routes/Events.js`)
- Event creation now **requires** `type` field
- Validates that type is one of the allowed categories
- Returns error if type is missing or invalid

**Validation:**
```javascript
const validTypes = ['Mass', 'Prayer', 'Social', 'Educational', 'Charity', 'Youth', 'Music', 'Retreat', 'Other'];
if (!validTypes.includes(type)) {
  return res.status(400).json({ error: "Invalid event type..." });
}
```

### 3. AI Algorithm (`server/routes/Recommendations.js`)
Enhanced the scoring algorithm with a new component:

#### **Event Type Preference Analysis (0-80 points)**
- Analyzes all events the user has previously liked
- Calculates frequency of each event type in their likes
- If current event matches a preferred type, boosts score
- Score formula: `frequency × 80` points
  - Example: If 50% of user's likes are "Youth" events, Youth events get +40 points
  - If 100% are "Prayer" events, Prayer events get +80 points

**Updated Scoring Breakdown:**
```
Total Score = Event Type Preference (0-80)
            + Collaborative Filtering (0-100+)
            + Popularity (15 × total_likes)
            + Parish Match (60)
            + Time Relevance (25-85)
            + Diversity (10)
```

**Algorithm Flow:**
1. Get all events user has liked
2. Count how many of each type
3. Calculate frequency: `type_count / total_likes`
4. Multiply by 80 for final boost

### 4. Admin Dashboard (`app/AdminDashboard.tsx`)
Added event type selection UI:

**New State Variables:**
```javascript
const [newEventType, setNewEventType] = useState("");
const eventTypes = ['Mass', 'Prayer', 'Social', 'Educational', 'Charity', 'Youth', 'Music', 'Retreat', 'Other'];
```

**New UI Components:**
- Event Type picker dropdown (required field)
- Visual confirmation when type is selected ✅
- Validation: Shows alert if type is not selected
- Reset: Clears type after event is created

**User Experience:**
1. Admin selects event type from dropdown
2. Green checkmark shows selected type
3. Cannot submit event without selecting type
4. Clear error message if validation fails

## How It Works for Users

### Example Scenario:
**User Profile:**
- Liked 10 events total
- 6 were "Youth" events (60%)
- 3 were "Social" events (30%)
- 1 was "Educational" (10%)

**Recommendation Scoring:**
- New Youth event: +48 points (0.6 × 80)
- New Social event: +24 points (0.3 × 80)
- New Educational event: +8 points (0.1 × 80)
- New Mass event: +0 points (never liked before)

This ensures users see more events similar to what they've enjoyed before!

## Benefits

1. **Personalized Recommendations**: Events match user interests better
2. **Better Discovery**: Users find events they're more likely to attend
3. **Data Quality**: Structured event categorization improves data consistency
4. **Future Analytics**: Can analyze which event types are most popular
5. **Smart Defaults**: New users still get recommendations (no type preference needed)

## Testing the Feature

### 1. Create Events with Types
- Login as admin
- Go to assigned church
- Create new event and select a type
- Verify event is saved with type

### 2. Test AI Recommendations
- Login as regular user
- Like several events of the same type (e.g., 3-4 Youth events)
- Check AI recommendations section
- Should see more events of that type recommended

### 3. Debug Endpoint
Use the debug endpoint to see scoring details:
```
GET http://localhost:3000/api/recommendations/debug/user@example.com
```

Response includes:
- User's liked events and their types
- Top 10 event scores with type information
- Statistics about the recommendation process

## Migration Notes

**Existing Events:**
- Events created before this update won't have a type
- They default to 'Other' category
- Admins should update important events with proper types
- AI will still work but won't use type preference for old events

**Backward Compatibility:**
- Algorithm gracefully handles events without types
- No errors if `event.type` is undefined
- Simply skips type preference scoring for those events

## Console Logs for Debugging

When AI calculates recommendations, you'll see logs like:
```
[AI] Type preference boost: Youth (+48.0 points)
[AI Recommendations] Top 5 scores: [...]
```

These help track how type preferences affect recommendations.

## Future Enhancements

Possible improvements for later:
1. Allow users to set preferred event types in their profile
2. Add event subtypes (e.g., Youth -> Teen, Young Adult, College)
3. Track type preference changes over time
4. Show type distribution in admin analytics
5. Let users filter events by type

---

**Last Updated:** November 24, 2025
