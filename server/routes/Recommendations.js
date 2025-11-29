const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Church = require('../models/ChurchsCredential');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

/**
 * COLLABORATIVE FILTERING RECOMMENDATION ALGORITHM
 * ================================================
 * This function calculates a score for each event to determine how relevant it is to the user.
 * Higher scores mean the event is more likely to interest the user.
 * 
 * @param {Object} event - The event we're scoring
 * @param {Array} userLikedEventIds - Array of event IDs the current user has liked
 * @param {String} userParish - The user's home parish/church name
 * @param {Array} allUsers - All users in the database (to find similar users)
 * @param {String} userId - The current user's ID
 * @param {Array} allEvents - All events in the system (to analyze user's type preferences)
 * @returns {Number} - Final score for this event (higher = better recommendation)
 */
function calculateEventScore(event, userLikedEventIds, userParish, allUsers, userId, allEvents = []) {
  let score = 0; // Start with 0 points
  const eventIdStr = String(event._id); // Convert event ID to string for comparison

  // ===================================================================
  // STEP 1: Filter out already-liked events
  // ===================================================================
  // If the user already liked this event, give it a very negative score
  // This ensures we never recommend something they've already interacted with
  if (userLikedEventIds.includes(eventIdStr)) {
    return -1000; // Never recommend already liked events
  }

  // ===================================================================
  // STEP 2: EVENT TYPE PREFERENCE - Analyze user's favorite event types
  // ===================================================================
  // Look at what types of events the user has liked before
  // If this event matches their preferred types, boost the score
  if (event.type && userLikedEventIds.length > 0 && allEvents.length > 0) {
    // Find all events the user has liked and count types
    const userLikedEvents = allEvents.filter(e => userLikedEventIds.includes(String(e._id)));
    const typeCount = {};
    
    userLikedEvents.forEach(e => {
      if (e.type) {
        typeCount[e.type] = (typeCount[e.type] || 0) + 1;
      }
    });
    
    // If user has liked this event type before, boost score based on frequency
    if (typeCount[event.type]) {
      const frequency = typeCount[event.type] / userLikedEvents.length; // 0 to 1
      score += frequency * 80; // Up to 80 points for strongly preferred types
      console.log(`[AI] Type preference boost: ${event.type} (+${(frequency * 80).toFixed(1)} points)`);
    }
  }

  // ===================================================================
  // STEP 2.5: CHURCH/LOCATION PREFERENCE - Learn favorite churches
  // ===================================================================
  // Analyze which churches the user tends to like events from
  // If user frequently likes events from specific churches, boost those
  if (event.church && userLikedEventIds.length > 0 && allEvents.length > 0) {
    const userLikedEvents = allEvents.filter(e => userLikedEventIds.includes(String(e._id)));
    const churchCount = {};
    
    userLikedEvents.forEach(e => {
      if (e.church) {
        const churchName = String(e.church).toLowerCase();
        churchCount[churchName] = (churchCount[churchName] || 0) + 1;
      }
    });
    
    // Check if user has liked events from this church before
    const eventChurchName = String(event.church).toLowerCase();
    if (churchCount[eventChurchName]) {
      const frequency = churchCount[eventChurchName] / userLikedEvents.length; // 0 to 1
      score += frequency * 50; // Up to 50 points for preferred churches
      console.log(`[AI] Church preference boost: ${event.church} (+${(frequency * 50).toFixed(1)} points)`);
    }
  }

  // ===================================================================
  // STEP 2.7: TIME PATTERN PREFERENCE - Learn preferred event times
  // ===================================================================
  // Analyze what time of day the user prefers events (morning, afternoon, evening)
  if (event.timeFrom && userLikedEventIds.length > 0 && allEvents.length > 0) {
    const userLikedEvents = allEvents.filter(e => userLikedEventIds.includes(String(e._id)));
    
    // Categorize times: morning (6-12), afternoon (12-17), evening (17-22), night (22-6)
    const getTimeCategory = (timeStr) => {
      if (!timeStr) return null;
      const hour = parseInt(timeStr.split(':')[0]);
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    };
    
    const timeCategoryCount = {};
    userLikedEvents.forEach(e => {
      const category = getTimeCategory(e.timeFrom);
      if (category) {
        timeCategoryCount[category] = (timeCategoryCount[category] || 0) + 1;
      }
    });
    
    // Check if current event matches user's preferred time
    const eventTimeCategory = getTimeCategory(event.timeFrom);
    if (eventTimeCategory && timeCategoryCount[eventTimeCategory]) {
      const frequency = timeCategoryCount[eventTimeCategory] / userLikedEvents.length;
      score += frequency * 40; // Up to 40 points for preferred time slots
      console.log(`[AI] Time preference boost: ${eventTimeCategory} (+${(frequency * 40).toFixed(1)} points)`);
    }
  }

  // ===================================================================
  // STEP 3: COLLABORATIVE FILTERING - Find users with similar taste
  // ===================================================================
  // This is the core AI component. We find users who liked similar events,
  // then recommend what THEY liked that the current user hasn't seen yet.
  
  let similarityScore = 0; // Will accumulate points from similar users
  const similarUsers = []; // Track which users are similar (for debugging)
  
  // Loop through every user in the database
  allUsers.forEach(otherUser => {
    // Skip comparing the user to themselves
    if (String(otherUser._id) === userId) return;
    
    // Get the other user's liked events as an array of strings
    const otherLikes = (otherUser.likedEvents || []).map(id => String(id));
    
    // Skip users who haven't liked anything (can't compare)
    if (otherLikes.length === 0) return;
    
    // JACCARD SIMILARITY CALCULATION:
    // Measures how similar two users are based on their likes
    // Formula: (number of events both liked) / (total unique events either liked)
    // Example: User A likes [1,2,3], User B likes [2,3,4]
    //          Intersection = [2,3] (2 events)
    //          Union = [1,2,3,4] (4 events)
    //          Similarity = 2/4 = 0.5 (50% similar)
    
    const intersection = userLikedEventIds.filter(id => otherLikes.includes(id));
    const union = new Set([...userLikedEventIds, ...otherLikes]);
    
    // Only consider users who have at least 1 overlapping like
    if (intersection.length > 0) {
      const similarity = intersection.length / union.size; // Value between 0 and 1
      similarUsers.push({ userId: otherUser._id, similarity, likes: otherLikes });
      
      // KEY INSIGHT: If this similar user liked the current event, boost the score!
      // More similar users = higher weight (multiply by 100 to make it significant)
      if (otherLikes.includes(eventIdStr)) {
        similarityScore += similarity * 100; // Weight by how similar the users are
      }
    }
  });
  
  // Add collaborative filtering points to total score
  score += similarityScore;

  // ===================================================================
  // STEP 3: POPULARITY METRIC - Wisdom of the crowd
  // ===================================================================
  // Count how many users in total have liked this event
  // Popular events are more likely to be good recommendations
  const totalLikes = allUsers.filter(u => {
    const likes = (u.likedEvents || []).map(id => String(id));
    return likes.includes(eventIdStr);
  }).length;
  
  // Add 15 points for each user who liked this event
  score += totalLikes * 15; // Higher weight for popular events

  // ===================================================================
  // STEP 4: PARISH PREFERENCE - Local events are more relevant
  // ===================================================================
  // Users are more likely to attend events at their home parish
  // Give bonus points if the event is from the user's church
  if (userParish && event.church && String(event.church).toLowerCase().includes(userParish.toLowerCase())) {
    score += 60; // Significant boost for parish match
  }

  // ===================================================================
  // STEP 5: TIME RELEVANCE - Prioritize upcoming events
  // ===================================================================
  // Events happening soon are more actionable than far-future events
  // Past events should not be recommended
  if (event.dates) {
    // Handle both single date and array of dates
    const datesArray = Array.isArray(event.dates) ? event.dates : [event.dates];
    
    // Filter to only future dates (ignore past events)
    const futureDates = datesArray.filter(d => {
      const dt = new Date(d);
      return dt > new Date(); // Only dates in the future
    });
    
    if (futureDates.length > 0) {
      score += 25; // Base bonus for any future event
      
      // EXTRA BOOST: Events happening within the next 2 weeks
      const soonDates = futureDates.filter(d => {
        const dt = new Date(d);
        const diff = dt - new Date(); // Milliseconds until event
        return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
      });
      
      if (soonDates.length > 0) {
        score += 40; // Boost for events in next 2 weeks
        
        // EVEN MORE BOOST: Events happening this week are most urgent
        const thisWeek = soonDates.filter(d => {
          const dt = new Date(d);
          const diff = dt - new Date();
          return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        });
        if (thisWeek.length > 0) score += 20; // Extra points for this week
      }
    }
  }

  // ===================================================================
  // STEP 6: EVENT DIVERSITY - Encourage variety (future enhancement)
  // ===================================================================
  // Check if user has liked events from this church before
  // This could help introduce variety in recommendations
  // Currently a placeholder for future implementation
  const userLikedFromSameChurch = userLikedEventIds.length > 0 && allUsers.some(u => {
    if (String(u._id) !== userId) return false;
    const likes = (u.likedEvents || []).map(id => String(id));
    // TODO: Need event-church mapping to implement this properly
    return false; // Placeholder
  });
  
  if (userLikedFromSameChurch) score += 10; // Small diversity boost

  // ===================================================================
  // RETURN FINAL SCORE
  // ===================================================================
  // Total score is the sum of all components:
  // - Event type preference: 0-80 points (learns user's favorite event types)
  // - Church preference: 0-50 points (learns user's favorite churches/locations)
  // - Time preference: 0-40 points (learns preferred time of day: morning/afternoon/evening)
  // - Collaborative filtering: 0-100+ points (depends on user similarity)
  // - Popularity: 15 points per like
  // - Parish match: 60 points
  // - Time relevance: 25-85 points (25 base + up to 60 for urgency)
  // - Diversity: 10 points
  return score;
}

/**
 * MAIN RECOMMENDATION ENDPOINT
 * ============================
 * GET /api/recommendations
 * Returns the top 3 recommended events for the authenticated user
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Response: { recommendations: [event1, event2, event3] }
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Extract user ID from the JWT token (set by authenticate middleware)
    const userId = req.user.id;
    console.log('[AI Recommendations] Request from user:', userId);
    
    // ===================================================================
    // STEP 1: Get the current user's data from database
    // ===================================================================
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Extract user's liked events as an array of strings for comparison
    const userLikedEventIds = (user.likedEvents || []).map(id => String(id));
    const userParish = user.parish; // User's home church/parish
    
    console.log('[AI Recommendations] User likes:', userLikedEventIds.length, 'events');
    console.log('[AI Recommendations] User parish:', userParish);

    // ===================================================================
    // STEP 2: SPECIAL CASE - New users with no likes
    // ===================================================================
    // If user hasn't liked any events yet, collaborative filtering won't work
    // Instead, show them upcoming events sorted by date (most recent first)
    if (userLikedEventIds.length === 0) {
      console.log('[AI Recommendations] New user - showing upcoming events');
      
      // Fetch all churches and their events
      const churches = await Church.find({});
      const allEvents = [];
      
      // Extract all events from all churches into a flat array
      churches.forEach(church => {
        if (Array.isArray(church.events)) {
          church.events.forEach(event => {
            allEvents.push({
              ...event._doc || event, // Get plain object from Mongoose document
              _id: event._id,
              church: church.name,
              churchLocation: church.location,
            });
          });
        }
      });

      // Filter to only future events, sort by date, and format for frontend
      const upcomingEvents = allEvents
        .filter(ev => {
          if (!ev.dates) return false;
          const dates = Array.isArray(ev.dates) ? ev.dates : [ev.dates];
          return dates.some(d => new Date(d) > new Date()); // Only future dates
        })
        .sort((a, b) => {
          // Sort by earliest date (ascending order)
          const dateA = Array.isArray(a.dates) ? new Date(a.dates[0]) : new Date(a.dates);
          const dateB = Array.isArray(b.dates) ? new Date(b.dates[0]) : new Date(b.dates);
          return dateA - dateB;
        })
        .slice(0, 3) // Get top 3
        .map(ev => ({
          // Format event data for frontend consumption
          id: ev._id,
          title: ev.name || ev.title,
          parish: ev.church,
          location: ev.location || ev.churchLocation,
          dateLabel: ev.dates,
          timeLabel: ev.timeFrom && ev.timeTo ? `${ev.timeFrom} - ${ev.timeTo}` : (ev.timeFrom || ev.timeTo || ''),
          imageUrl: ev.images?.[0] || ev.image || '',
          score: 0, // No score for new users
          description: ev.description || ''
        }));

      return res.json({
        recommendations: upcomingEvents,
        message: upcomingEvents.length > 0 
          ? 'Here are some upcoming events to get started!' 
          : 'No upcoming events available.'
      });
    }

    // ===================================================================
    // STEP 3: Fetch ALL churches and extract their events
    // ===================================================================
    // Get all churches with events
    const churches = await Church.find({});
    
    // Extract all events from all churches
    const allEvents = [];
    churches.forEach(church => {
      if (Array.isArray(church.events)) {
        church.events.forEach(event => {
          allEvents.push({
            ...event._doc || event, // Get plain object from Mongoose document
            _id: event._id,
            church: church.name,
            churchLocation: church.location,
          });
        });
      }
    });

    // ===================================================================
    // STEP 4: Filter out already-liked events and own parish events
    // ===================================================================
    // Don't recommend events the user has already interacted with
    // Also exclude events from the user's own parish (only show other parishes)
    const candidateEvents = allEvents.filter(ev => {
      // Exclude already liked events
      if (userLikedEventIds.includes(String(ev._id))) return false;
      
      // Exclude events from user's own parish - only recommend other parishes
      if (userParish && ev.church) {
        const eventChurch = String(ev.church).toLowerCase().trim();
        const userChurch = String(userParish).toLowerCase().trim();
        if (eventChurch === userChurch || eventChurch.includes(userChurch) || userChurch.includes(eventChurch)) {
          return false;
        }
      }
      
      return true;
    });
    console.log('[AI Recommendations] Total events:', allEvents.length);
    console.log('[AI Recommendations] User parish:', userParish);
    console.log('[AI Recommendations] Candidate events (other parishes only):', candidateEvents.length);

    // ===================================================================
    // STEP 5: Fetch all users for collaborative filtering
    // ===================================================================
    // Get all users with their liked events and parish info
    // We only need these fields, not full user profiles (optimization)
    const allUsers = await User.find({}, 'likedEvents parish');
    console.log('[AI Recommendations] Total users in system:', allUsers.length);

    // ===================================================================
    // STEP 6: Score each candidate event using the AI algorithm
    // ===================================================================
    // Apply the collaborative filtering algorithm to each event
    // Pass allEvents so the algorithm can analyze user's event type preferences
    const scoredEvents = candidateEvents.map(event => ({
      event,
      score: calculateEventScore(event, userLikedEventIds, userParish, allUsers, userId, allEvents)
    }));

    // ===================================================================
    // STEP 7: Sort by score (highest first) and select top 3
    // ===================================================================
    scoredEvents.sort((a, b) => b.score - a.score); // Descending order
    
    // Log top 5 scores for debugging purposes
    console.log('[AI Recommendations] Top 5 scores:', scoredEvents.slice(0, 5).map(e => ({ title: e.event.name, score: e.score })));
    
    // Format the top 3 events for frontend consumption
    const topEvents = scoredEvents.slice(0, 3).map(item => ({
      id: item.event._id,
      title: item.event.name || item.event.title,
      parish: item.event.church,
      location: item.event.location || item.event.churchLocation,
      dateLabel: item.event.dates,
      timeLabel: item.event.timeFrom && item.event.timeTo 
        ? `${item.event.timeFrom} - ${item.event.timeTo}` 
        : (item.event.timeFrom || item.event.timeTo || ''),
      imageUrl: item.event.images?.[0] || item.event.image || '',
      score: item.score, // Include score for debugging/analytics
      description: item.event.description || ''
    }));

    console.log('[AI Recommendations] Returning', topEvents.length, 'recommendations');

    // ===================================================================
    // STEP 8: Return recommendations to the frontend
    // ===================================================================
    return res.json({ 
      recommendations: topEvents,
      message: topEvents.length > 0 
        ? `Found ${topEvents.length} personalized recommendations based on your likes!` 
        : 'No new recommendations available. Like more events to get better suggestions!'
    });

  } catch (err) {
    // Log any errors that occur during the recommendation process
    console.error('Recommendations error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * DEBUG ENDPOINT (Remove in production!)
 * ======================================
 * GET /api/recommendations/debug/:email
 * 
 * Manually test the recommendation algorithm for any user by their email
 * Returns detailed stats and top 10 scored events for debugging
 * 
 * IMPORTANT: This endpoint has NO authentication - remove before production!
 * 
 * Example: GET /api/recommendations/debug/user@example.com
 */
router.get('/debug/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    // Find user by email (no authentication required - for debugging only)
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found', email });
    }

    // Get all the data needed for the algorithm
    const userLikedEventIds = (user.likedEvents || []).map(id => String(id));
    const allUsers = await User.find({}, 'likedEvents parish email');
    const churches = await Church.find({});
    
    // Extract all events from all churches (simplified format for debugging)
    const allEvents = [];
    churches.forEach(church => {
      if (Array.isArray(church.events)) {
        church.events.forEach(event => {
          allEvents.push({
            _id: event._id,
            name: event.name,
            church: church.name,
            dates: event.dates,
            type: event.type, // Include type for analysis
            timeFrom: event.timeFrom, // Include time for time preference analysis
            timeTo: event.timeTo
          });
        });
      }
    });

    // Filter out events the user already liked
    const candidateEvents = allEvents.filter(ev => !userLikedEventIds.includes(String(ev._id)));
    
    // Score all candidate events using the AI algorithm (with allEvents for type analysis)
    const scoredEvents = candidateEvents.map(event => ({
      event,
      score: calculateEventScore(event, userLikedEventIds, user.parish, allUsers, user._id, allEvents)
    }));

    // Sort by score (highest first)
    scoredEvents.sort((a, b) => b.score - a.score);

    // Analyze user's learned preferences for debugging
    const userLikedEvents = allEvents.filter(e => userLikedEventIds.includes(String(e._id)));
    
    // Calculate type preferences
    const typePreferences = {};
    userLikedEvents.forEach(e => {
      if (e.type) typePreferences[e.type] = (typePreferences[e.type] || 0) + 1;
    });
    
    // Calculate church preferences
    const churchPreferences = {};
    userLikedEvents.forEach(e => {
      if (e.church) churchPreferences[e.church] = (churchPreferences[e.church] || 0) + 1;
    });
    
    // Calculate time preferences
    const getTimeCategory = (timeStr) => {
      if (!timeStr) return null;
      const hour = parseInt(timeStr.split(':')[0]);
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    };
    
    const timePreferences = {};
    userLikedEvents.forEach(e => {
      const category = getTimeCategory(e.timeFrom);
      if (category) timePreferences[category] = (timePreferences[category] || 0) + 1;
    });

    // Return detailed debugging information
    return res.json({
      user: {
        email: user.email,
        parish: user.parish,
        likedCount: userLikedEventIds.length,
        likedEventIds: userLikedEventIds
      },
      learnedPreferences: {
        eventTypes: typePreferences,
        churches: churchPreferences,
        timeSlots: timePreferences
      },
      stats: {
        totalUsers: allUsers.length,
        totalEvents: allEvents.length,
        candidateEvents: candidateEvents.length
      },
      top10: scoredEvents.slice(0, 10).map(item => ({
        title: item.event.name,
        church: item.event.church,
        type: item.event.type,
        time: item.event.timeFrom,
        score: item.score.toFixed(2),
        id: item.event._id
      }))
    });
  } catch (err) {
    console.error('Debug recommendations error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
