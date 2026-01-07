# Troubleshooting: "This App is Blocked" Error

## Critical: Check Publishing Status (Not Just Verification)

**Important**: "Verified" and "Published" are **different** in Google OAuth:

- ✅ **Verified**: App has completed Google's verification process
- ❌ **Published**: App is available to ALL users (not just test users)

**If your app is verified but NOT published, users will still see "This app is blocked".**

### Step 0: Fix Permissions First (If You See "You need additional access")

**If you see a permissions error**, fix this first before trying to access the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project from the project dropdown
3. Go to **"IAM & Admin"** → **"IAM"** (in the left sidebar)
4. Find your email address in the list
5. If it's missing or has a limited role:
   - Click **"+ GRANT ACCESS"** or **"+ ADD"** (if you're not listed)
   - OR click the **edit icon** (pencil) next to your email (if you are listed)
6. Grant yourself **"Owner"** role (or at minimum **"Editor"**)
7. Click **"SAVE"**
8. Wait 10-30 seconds for permissions to propagate
9. Then proceed to Step 1 below

### Step 1: Navigate to OAuth Consent Screen

**Important**: If clicking "OAuth consent screen" takes you to the "Branding" page (Google Auth Platform), you're in the right place! The Publishing status is on the **"Overview"** page, not the Branding page.

1. In the left sidebar, click **"Overview"** (it should be at the top of the Google Auth Platform menu)
2. The Publishing status should be at the top of the Overview page
3. If it says "Testing", click **"Publish App"**

If clicking "OAuth consent screen" redirects you elsewhere, try these methods:

#### Method 1: Direct Sidebar Link (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project** (the one for bigyear.app) from the project dropdown at the top
3. In the left sidebar, under **"APIs & Services"**, you should see **"OAuth consent screen"** listed
4. **Click directly on "OAuth consent screen"** in the left sidebar
5. If it redirects you, try the methods below

#### Method 2: Through Your OAuth Client ID

1. On the Credentials page, find your **OAuth 2.0 Client ID** (should be listed, e.g., "Big Year Calendar")
2. **Click on the name** of the OAuth client (it's a clickable link)
3. This will open the client details page
4. Look for a link or section about **"OAuth consent screen"** or **"CONFIGURE CONSENT SCREEN"**
5. OR try clicking the **edit icon** (pencil) next to your OAuth client - sometimes the consent screen settings are accessible from there

#### Method 3: Direct URL with Project ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project** and note the **Project ID** (shown in the project dropdown or in the URL)
3. Try this direct URL format: `https://console.cloud.google.com/apis/credentials/consent?project=YOUR_PROJECT_ID`
   - Replace `YOUR_PROJECT_ID` with your actual project ID

#### Method 4: Search in Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project**
3. Use the search bar at the top (magnifying glass icon) and type: **"OAuth consent screen"**
4. Click on the result

#### Method 5: If Consent Screen Isn't Configured Yet

If none of the above work, the OAuth consent screen may not be set up yet. Try:

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If you see a prompt to configure the consent screen first, click **"CONFIGURE CONSENT SCREEN"**
4. This will take you to the consent screen setup wizard

#### Method 6: Fix Permissions Issue (If You See "You need additional access")

If you see a "You need additional access" error, even though you're the only user, you need to grant yourself the proper IAM role:

**Option A: Grant Yourself Owner Role (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (big-ass-calendar or bigyear.app)
3. In the left sidebar, go to **"IAM & Admin"** → **"IAM"**
4. Look for your email address in the list
5. If you see your email but with a limited role (like Viewer), click the **pencil/edit icon** next to your email
6. Change your role to **"Owner"** or **"Editor"**
7. Click **"SAVE"**
8. Wait a few seconds, then try accessing the OAuth consent screen again

**Option B: If You Don't See Yourself in IAM**

1. On the IAM page, click **"+ GRANT ACCESS"** or **"+ ADD"**
2. Enter your email address
3. Select role: **"Owner"** (or at minimum **"Editor"**)
4. Click **"SAVE"**
5. Wait a few seconds, then try accessing the OAuth consent screen again

**Option C: If You Can't Access IAM Either**

If you can't access IAM & Admin, you may need to:

1. Check if you're signed in with the correct Google account
2. The project might be under a different Google account - check the project dropdown to see all projects
3. If the project was created by a different account, you'll need that account to grant you permissions

#### Method 7: If You Have Owner Role But Still See "You need additional access"

If you have Owner/Organization Administrator role but still see the permissions error:

**This might be a Google Auth Platform vs Classic OAuth issue. Try:**

1. **Clear browser cache and cookies** for console.cloud.google.com
2. **Sign out and sign back in** to Google Cloud Console
3. **Try a different browser** or incognito window
4. **Wait 5-10 minutes** - sometimes permission changes take time to propagate
5. **Check if you're on the wrong interface**: The error might be from the new "Google Auth Platform" - try accessing the classic OAuth consent screen instead
6. **Alternative: Check Publishing Status via API** (if you have gcloud CLI installed):
   ```bash
   gcloud auth application-default login
   gcloud projects describe YOUR_PROJECT_ID
   ```
7. **Contact Google Support** if the issue persists - this might be a bug on Google's side

#### Method 8: If Sidebar Link Redirects

If clicking "OAuth consent screen" in the sidebar redirects you to overview:

1. **Right-click** on "OAuth consent screen" in the sidebar and select **"Open in new tab"** (this bypasses some redirect issues)
2. **Try clicking on your OAuth 2.0 Client ID name** (e.g., "Big Year Calendar" on the Credentials page) - sometimes the consent screen is accessible from the client details
3. **Use the search bar** at the top of the console and type "OAuth consent screen" - click the result
4. **Try in an incognito/private window** - browser extensions or cache might be interfering
5. **Check browser console** (F12 → Console tab) for JavaScript errors when clicking the link
6. **Try the direct URL**: Get your Project ID from the URL or project dropdown, then go to:
   `https://console.cloud.google.com/apis/credentials/consent?project=YOUR_PROJECT_ID`
   (Replace `YOUR_PROJECT_ID` with your actual project ID)

### Step 1.5: If Consent Screen Needs Initial Setup

If you're taken to a setup wizard instead of the consent screen page:

1. **User Type**: Choose **"External"** (unless you have a Google Workspace)
2. Click **"CREATE"**
3. Fill out the required fields:
   - **App name**: Big Year
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Application home page**: `https://bigyear.app`
   - **Privacy Policy link**: `https://bigyear.app/privacy`
   - **Terms of Service link**: `https://bigyear.app/terms`
4. Click **"SAVE AND CONTINUE"**
5. On the **Scopes** page, click **"ADD OR REMOVE SCOPES"**
6. Add these scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click **"UPDATE"** then **"SAVE AND CONTINUE"**
8. On the **Test users** page, you can add test users or skip for now
9. Click **"SAVE AND CONTINUE"** then **"BACK TO DASHBOARD"**

### Step 2: Check Publishing Status

Once you're on the OAuth consent screen page:

1. Look at the **Publishing status** section at the very top of the page
2. **What does it say?**
   - If it says **"Testing"** → This is the problem! Click **"Publish App"**
   - If it says **"In production"** → Skip to Step 3

**If you can't access the OAuth consent screen page due to permissions errors (even with Owner role):**

Try these workarounds:

1. **Check via OAuth Client ID page:**

   - Go to "APIs & Services" → "Credentials"
   - Click on your OAuth 2.0 Client ID name
   - Look for publishing status or consent screen information there

2. **Try the classic URL format:**

   - Get your Project ID from the URL or project dropdown
   - Try: `https://console.cloud.google.com/apis/credentials/consent?project=YOUR_PROJECT_ID`
   - Sometimes the new Google Auth Platform interface has bugs, but the classic interface works

3. **Check if there's a "Publish" button elsewhere:**
   - Look for any "Publish" or "Publishing status" links in the Credentials page
   - Sometimes Google shows publishing controls in different places

### Step 3: Publish Your App

If the status is "Testing":

1. Click the **"Publish App"** button
2. Read the warning about making the app available to all users
3. Click **"Confirm"** to publish
4. **Wait 5-10 minutes** for changes to propagate
5. Test with a user account that is NOT in your test users list

### Step 4: Verify All Required Settings

Even if published, verify these settings:

#### A. OAuth Consent Screen Configuration

1. Navigate to OAuth consent screen (see Step 1 above for navigation)
2. Verify these fields are filled:
   - ✅ **App name**: Big Year
   - ✅ **User support email**: Your email
   - ✅ **Developer contact information**: Your email
   - ✅ **Application home page**: `https://bigyear.app`
   - ✅ **Privacy Policy link**: `https://bigyear.app/privacy`
   - ✅ **Terms of Service link**: `https://bigyear.app/terms`

#### B. Check Scopes

Under **Scopes**, ensure ALL of these are listed:

- ✅ `openid`
- ✅ `email`
- ✅ `profile`
- ✅ `https://www.googleapis.com/auth/calendar.readonly`
- ✅ `https://www.googleapis.com/auth/calendar.events` ⚠️ (sensitive scope)

#### C. Check for Country/Region Restrictions

1. Scroll down on the OAuth consent screen page
2. Look for **"Restricted"** or **"Country/Region restrictions"** section
3. If any countries are blocked, either:
   - Remove the restrictions (for global access), OR
   - Add the countries where your users are located

#### D. Verify Authorized Redirect URIs

1. In Google Cloud Console, go to **"APIs & Services"** → **"Credentials"**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure this is listed:
   - ✅ `https://bigyear.app/api/auth/callback/google`

### Step 5: Check Verification Center Details

Even if the app shows as "verified", check the details:

1. Navigate to OAuth consent screen (see Step 1 above for navigation)
2. Click **"Go to Verification Center"** (in the App verification section)
3. Check:
   - ✅ Is verification complete for ALL scopes?
   - ✅ Are there any pending items?
   - ✅ Does it show verification for sensitive scopes like `calendar.events`?

**Note**: Sometimes verification is complete for branding but not for sensitive scopes.

### Step 6: Test After Changes

After making changes:

1. **Wait 5-10 minutes** for changes to propagate
2. Clear browser cookies for `accounts.google.com` OR use an incognito window
3. Try signing in with an account that is NOT in your test users list
4. If still blocked, wait up to **24-48 hours** for full propagation

### Step 7: Common Issues

#### Issue: "Verified" but Still Blocked

**Solution**: Check Publishing status (Step 1). The app must be **Published**, not just verified.

#### Issue: Only Some Users Blocked

**Possible causes**:

- Those users' Google accounts are in restricted countries
- Those users need to clear their browser cache
- Those users are using a different Google account that has restrictions

**Solution**:

- Check country restrictions in OAuth consent screen
- Ask users to try incognito mode
- Ask users to try a different Google account

#### Issue: App is Published but Still Blocked

**Check**:

1. Are all scopes listed in OAuth consent screen?
2. Is the redirect URI correct?
3. Are there any country restrictions?
4. Has it been more than 10 minutes since publishing?

**Solution**: Wait 24-48 hours for full propagation, or check Verification Center for pending items.

### If You Still Can't Access OAuth Consent Screen

If you've tried everything and still can't access the OAuth consent screen (even with Owner role, different machines, browsers, etc.):

1. **See `ALTERNATIVE_SOLUTIONS.md`** for:

   - Using gcloud CLI to check/publish
   - Granting specific `oauthconfig.editor` role
   - Checking required APIs
   - Organization-level policy checks
   - Contacting Google Support

2. **Try creating a new OAuth client** - this sometimes triggers the consent screen setup wizard:

   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - If prompted to configure consent screen, click that link

3. **Contact Google Cloud Support** - this might be a bug on their side

## Quick Checklist

Before asking for help, verify:

- [ ] Publishing status is **"In production"** (not "Testing")
- [ ] All required OAuth consent screen fields are filled
- [ ] All scopes are listed in OAuth consent screen
- [ ] No country/region restrictions (or restrictions include your users' countries)
- [ ] Authorized redirect URI is correct: `https://bigyear.app/api/auth/callback/google`
- [ ] Waited at least 10 minutes after making changes
- [ ] Tested in incognito mode with a non-test user account

### Still Having Issues?

If you've checked all of the above and users are still blocked:

1. Take a screenshot of the OAuth consent screen showing:
   - Publishing status
   - All scopes listed
   - Any country restrictions
2. Check the Verification Center for any pending items
3. Note the exact error message users are seeing
4. Check if the issue affects all users or only specific users/countries
