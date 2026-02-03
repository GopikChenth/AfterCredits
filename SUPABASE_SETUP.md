# Setting Up Unique Usernames in Supabase

## Step 1: Run the SQL Script

1. **Go to Supabase SQL Editor:**
   - Visit: https://app.supabase.com/project/kiapyhqhjcrxjwzazobt/sql/new

2. **Copy and paste the SQL from `supabase_setup.sql`**

3. **Click "Run"** to execute the script

This will:

- ✅ Create a `profiles` table with unique username constraint
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create an automatic trigger to create profiles on signup
- ✅ Add an index for fast username lookups

---

## Step 2: Test It!

1. Try signing up with a username
2. Try signing up again with the **same username**
3. You should see: **"Username Taken"** error ✅

---

## What Happens Now:

**When a user signs up:**

1. App checks if username is available
2. If taken → Shows error, stops signup
3. If available → Creates account
4. Supabase automatically creates a profile entry
5. Username is now reserved!

**Benefits:**

- 🔒 **Unique usernames** - No duplicates possible
- ⚡ **Fast checks** - Indexed username column
- 🛡️ **Secure** - RLS ensures users can only edit their own profile
- 🤖 **Automatic** - Profile created via database trigger

---

## Troubleshooting:

**Error: "relation profiles does not exist"**
→ You haven't run the SQL script yet. Go to Step 1.

**Error: "duplicate key value violates unique constraint"**
→ Perfect! That means it's working! Username is already taken.
