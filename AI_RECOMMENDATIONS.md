# AI Recommendation System

## Overview
The AI recommendation system analyzes user behavior (liked events) and suggests the top 3 most relevant upcoming events.

## How It Works

### Algorithm Components

1. **Popularity Score** (10 points per like)
   - Counts how many users liked each event
   - Popular events get higher scores

2. **Parish Preference** (+50 points)
   - Events from user's home parish are prioritized
   - Helps users discover local community activities

3. **Time Relevance** (+20 to +50 points)
   - Upcoming events score higher than past ones
   - Events happening within 2 weeks get an extra boost (+30)
   - Ensures recommendations are actionable

4. **Collaborative Filtering** (Future enhancement)
   - Will find users with similar interests
   - Recommend events liked by similar users

### API Endpoint
```
GET /api/recommendations
Headers: { Authorization: Bearer <jwt_token> }

Response:
{
  "recommendations": [
    {
      "id": "event_id",
      "title": "Event Name",
      "parish": "Church Name",
      "location": "Address",
      "dateLabel": "2025-11-25",
      "timeLabel": "10:00 - 12:00",
      "imageUrl": "https://...",
      "score": 110,
      "description": "Event details..."
    }
  ],
  "message": "Found 3 recommended events"
}
```

### Frontend Integration

The recommendations appear at the top of the home page as a horizontal slider:
- Shows "Recommended For You ✨" section
- Displays top 3 AI-selected events
- Updates automatically when user likes/unlikes events
- Only visible to logged-in users with liked events

### Usage

1. **User likes events** - Taps heart icon on events they're interested in
2. **AI analyzes preferences** - Algorithm scores all available events
3. **Top 3 displayed** - Best matches shown in dedicated section
4. **Dynamic updates** - Recommendations refresh when user interacts

### Future Enhancements

- **Category-based similarity**: Group events by type (e.g., youth, prayer, social)
- **Location proximity**: Prioritize events within X km of user
- **User activity patterns**: Learn from attendance history
- **Advanced ML**: Use TensorFlow.js for neural network recommendations
- **A/B testing**: Optimize scoring weights based on user engagement

### Files Modified

- `server/routes/Recommendations.js` - AI recommendation endpoint
- `server/server.js` - Route registration
- `app/utils/recommend.ts` - API client function
- `app/home.tsx` - UI integration
