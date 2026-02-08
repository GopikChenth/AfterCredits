# **AfterCredits Database Schema Plan**

## **📊 Core Tables Needed**

### **1. User Management** ✅ (Already Exists)

```sql
profiles
├── id (UUID, primary key)
├── username (TEXT) - Real name
├── display_name (TEXT, unique) - Gamertag/Callsign
├── use_display_name (BOOLEAN) - Privacy toggle
├── avatar_url (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

### **2. User Library (Main Tracking)**

```sql
user_library
├── id (UUID, primary key)
├── user_id (UUID, references profiles)
├── media_type (TEXT) - 'anime', 'movie', 'game', 'comic', 'manga'
├── media_id (TEXT) - External API ID (AniList, TMDB, etc.)
├── status (TEXT) - 'watching', 'completed', 'dropped', 'plan_to_watch'
├── progress (INTEGER) - Episodes watched / Chapters read
├── total (INTEGER) - Total episodes / chapters
├── rating (INTEGER) - User's rating 1-10
├── is_favorite (BOOLEAN)
├── notes (TEXT) - Personal notes
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Indexes:
- user_id + media_type + media_id (unique)
- user_id + status
- user_id + is_favorite
```

---

### **3. User Reviews**

```sql
reviews
├── id (UUID, primary key)
├── user_id (UUID, references profiles)
├── media_type (TEXT)
├── media_id (TEXT)
├── rating (INTEGER) - 1-10 stars
├── review_text (TEXT)
├── is_spoiler (BOOLEAN)
├── likes_count (INTEGER, default 0)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Indexes:
- user_id
- media_type + media_id
- created_at (for recent reviews)
```

---

### **4. Custom Lists**

```sql
user_lists
├── id (UUID, primary key)
├── user_id (UUID, references profiles)
├── name (TEXT) - "Best Action Anime", "Top Movies 2024"
├── description (TEXT)
├── is_public (BOOLEAN)
├── media_type (TEXT) - Can be 'mixed' or specific
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

list_items
├── id (UUID, primary key)
├── list_id (UUID, references user_lists)
├── media_type (TEXT)
├── media_id (TEXT)
├── position (INTEGER) - For ordering
├── notes (TEXT)
└── added_at (TIMESTAMP)

Indexes:
- list_id + position (ordering)
```

---

### **5. User Statistics (Aggregated Data)**

```sql
user_stats
├── id (UUID, primary key)
├── user_id (UUID, references profiles, unique)
├── total_anime (INTEGER, default 0)
├── total_movies (INTEGER, default 0)
├── total_games (INTEGER, default 0)
├── total_comics (INTEGER, default 0)
├── total_manga (INTEGER, default 0)
├── episodes_watched (INTEGER, default 0)
├── chapters_read (INTEGER, default 0)
├── hours_spent (INTEGER, default 0) - Calculated
├── reviews_written (INTEGER, default 0)
├── lists_created (INTEGER, default 0)
└── updated_at (TIMESTAMP)

Note: Updated via triggers or scheduled jobs
```

---

### **6. User Settings (App Preferences)**

```sql
user_settings
├── id (UUID, primary key)
├── user_id (UUID, references profiles, unique)
├── theme (TEXT) - 'dark', 'light', 'auto'
├── default_media_type (TEXT) - 'anime', 'movie', etc.
├── show_anime (BOOLEAN, default true)
├── show_movies (BOOLEAN, default true)
├── show_games (BOOLEAN, default true)
├── show_comics (BOOLEAN, default true)
├── show_manga (BOOLEAN, default true)
├── notifications_enabled (BOOLEAN)
├── language (TEXT, default 'en')
└── updated_at (TIMESTAMP)
```

---

### **7. Favorites / Quick Access**

```sql
user_favorites
├── id (UUID, primary key)
├── user_id (UUID, references profiles)
├── media_type (TEXT)
├── media_id (TEXT)
├── added_at (TIMESTAMP)

Indexes:
- user_id + media_type
- user_id + added_at (descending)
```

---

### **8. Watch/Read History (Activity Timeline)**

```sql
user_activity
├── id (UUID, primary key)
├── user_id (UUID, references profiles)
├── activity_type (TEXT) - 'watched_episode', 'completed', 'started', 'reviewed'
├── media_type (TEXT)
├── media_id (TEXT)
├── details (JSONB) - {episode_number, chapter_number, etc.}
├── created_at (TIMESTAMP)

Indexes:
- user_id + created_at (descending)
```

---

## **🔄 Optional Advanced Tables**

### **9. Social Features (Future)**

```sql
user_follows
├── follower_id (UUID, references profiles)
├── following_id (UUID, references profiles)
└── created_at (TIMESTAMP)

review_likes
├── user_id (UUID, references profiles)
├── review_id (UUID, references reviews)
└── created_at (TIMESTAMP)
```

---

## **📋 Priority Implementation Order**

### **Phase 1: Core Tracking** (Implement First)

1. ✅ `profiles` - Already exists
2. 🔴 `user_library` - **CRITICAL** (track what users are watching)
3. 🔴 `user_settings` - **CRITICAL** (sidebar prefs, theme)

### **Phase 2: Enhanced Features**

4. 🟡 `user_stats` - Statistics dashboard
5. 🟡 `reviews` - User reviews
6. 🟡 `user_favorites` - Quick access favorites

### **Phase 3: Advanced**

7. 🟢 `user_lists` + `list_items` - Custom collections
8. 🟢 `user_activity` - Activity timeline
9. 🟢 Social features (optional)

---

## **🎯 Key Design Decisions**

### **Why NOT store full media data?**

- Use external APIs (AniList, TMDB, IGDB)
- Only store media_id + media_type
- Fetch fresh data from APIs when displaying
- Reduces database size and maintenance

### **Why JSONB for details?**

- Flexibility for different media types
- Anime: {episode_number, season}
- Games: {platform, playtime}
- Books: {page_number, chapter}

### **Why separate user_stats?**

- Fast dashboard loading
- Pre-calculated aggregations
- Updated via database triggers

---

# **Supabase Free Tier Capacity Analysis**

## **🎯 Free Tier Limits**

| Resource          | Free Tier Limit              |
| ----------------- | ---------------------------- |
| **Database Size** | 500 MB                       |
| **Bandwidth**     | 5 GB/month                   |
| **Auth Users**    | Unlimited                    |
| **API Requests**  | No hard limit (rate limited) |
| **Row Limit**     | None (storage-based)         |

---

## **💾 Storage Per User Calculation**

### **Conservative Active User Profile:**

| Table            | Avg Rows/User | Bytes/Row | Total/User  |
| ---------------- | ------------- | --------- | ----------- |
| `profiles`       | 1             | 500 B     | 500 B       |
| `user_library`   | 80 items      | 300 B     | 24 KB       |
| `reviews`        | 15 reviews    | 1 KB      | 15 KB       |
| `user_lists`     | 3 lists       | 500 B     | 1.5 KB      |
| `list_items`     | 30 items      | 200 B     | 6 KB        |
| `user_stats`     | 1             | 300 B     | 300 B       |
| `user_settings`  | 1             | 400 B     | 400 B       |
| `user_favorites` | 10 items      | 200 B     | 2 KB        |
| `user_activity`  | 150 entries   | 400 B     | 60 KB       |
| **TOTAL**        | -             | -         | **~110 KB** |

### **Heavy User Profile:**

| Table           | Avg Rows/User | Total/User  |
| --------------- | ------------- | ----------- |
| `user_library`  | 200 items     | 60 KB       |
| `reviews`       | 50 reviews    | 50 KB       |
| `user_lists`    | 8 lists       | 4 KB        |
| `list_items`    | 100 items     | 20 KB       |
| `user_activity` | 500 entries   | 200 KB      |
| **TOTAL**       | -             | **~340 KB** |

---

## **📊 Free Tier Capacity Estimates**

### **Scenario 1: Mostly Average Users**

```
Database Size: 500 MB
Average User: 110 KB

Capacity: 500 MB ÷ 110 KB = ~4,500 users
```

### **Scenario 2: Mixed User Base** (Recommended Estimate)

```
70% Average Users: 110 KB each
30% Heavy Users: 340 KB each

Weighted Average: (0.7 × 110) + (0.3 × 340) = 179 KB

Capacity: 500 MB ÷ 179 KB = ~2,800 users
```

### **Scenario 3: Conservative Estimate**

```
With 20% overhead for indexes, temp data, etc:

Usable Space: 500 MB × 0.8 = 400 MB
Average: 150 KB per user

Capacity: 400 MB ÷ 150 KB = ~2,600 users
```

---

## **🚀 Bandwidth Considerations**

**Free Tier: 5 GB/month**

### **Average Active User Monthly Bandwidth:**

| Activity         | Per Request | Monthly Usage       |
| ---------------- | ----------- | ------------------- |
| Login/Auth       | 2 KB        | 60 KB (30 logins)   |
| Load Library     | 50 KB       | 1.5 MB (30 loads)   |
| Add/Update Items | 5 KB        | 100 KB (20 updates) |
| Load Reviews     | 20 KB       | 200 KB (10 loads)   |
| Activity Sync    | 10 KB       | 300 KB (30 syncs)   |
| **TOTAL**        | -           | **~2.2 MB/month**   |

**Bandwidth Capacity:**

```
5 GB ÷ 2.2 MB = ~2,300 active monthly users
```

---

## **🎯 Final Estimate: FREE TIER CAPACITY**

### **✅ Recommended Safe Limits:**

| Metric                | Capacity               |
| --------------------- | ---------------------- |
| **Storage Limited**   | ~2,600 active users    |
| **Bandwidth Limited** | ~2,300 active users    |
| **SAFE ESTIMATE**     | **~2,000-2,500 users** |

### **⚠️ Bottleneck:**

**Bandwidth (5 GB/month)** will likely hit limits before storage.

---

## **💡 Optimization Strategies**

### **To Support More Users on Free Tier:**

1. **Cache External API Data Locally**
   - Store fetched anime/movie data in IndexedDB (client-side)
   - Reduces Supabase bandwidth usage
   - Only sync user-specific data

2. **Lazy Load Activities**
   - Don't fetch all 500 activity entries
   - Paginate: fetch 20 at a time
   - Reduces per-request size

3. **Compress Reviews**
   - Text compression for long reviews
   - Saves storage and bandwidth

4. **Aggregate Stats with Triggers**
   - Pre-calculate user_stats via DB triggers
   - One query vs multiple aggregations

5. **Client-Side Caching**
   - Cache user library for 5-10 minutes
   - Reduce repeated fetches

---

## **📈 Growth Path**

| User Count      | Tier                | Cost       | Notes                    |
| --------------- | ------------------- | ---------- | ------------------------ |
| 0 - 2,500       | **Free**            | $0/mo      | Current plan             |
| 2,500 - 10,000  | **Pro**             | $25/mo     | 8 GB DB, 50 GB bandwidth |
| 10,000 - 50,000 | **Pro + Add-ons**   | $50-100/mo | Scale as needed          |
| 50,000+         | **Team/Enterprise** | Custom     | Dedicated resources      |

---

## **🎯 Verdict:**

**Your schema can comfortably support:**

- ✅ **2,000-2,500 active users** on free tier
- ✅ **10,000+ users** at $25/month (Pro tier)
- ✅ **Excellent scalability** - pay as you grow

**This schema is well-optimized!** The design of storing only IDs and fetching from external APIs is perfect for free tier constraints. 🚀

---

## **📝 Next Steps**

1. Create `user_library` table first (Phase 1)
2. Create `user_settings` table (Phase 1)
3. Update existing services to use these tables
4. Create database triggers for stats updates
5. Add RLS (Row Level Security) policies
6. Implement client-side caching strategy
7. Monitor bandwidth usage as user base grows

---

_Last Updated: February 5, 2026_
_Document: AfterCredits Database Architecture & Capacity Planning_
