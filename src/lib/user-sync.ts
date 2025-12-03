import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"

/**
 * Syncs Clerk user with Supabase profile
 * Creates a profile if it doesn't exist, updates if it does
 * Returns the Supabase profile
 */
export async function syncUserWithSupabase() {
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    return null
  }

  const supabase = await createClient()
  
  // Get user email from Clerk
  const email = sessionClaims?.email as string | undefined
  if (!email) {
    return null
  }

  // Check if email is in owner_emails table
  const { data: ownerEmail } = await supabase
    .from("owner_emails")
    .select("email")
    .eq("email", email)
    .single()

  // Determine role based on owner_emails table
  const role = ownerEmail ? "owner" : "user"

  // Check if profile exists by Clerk ID
  const { data: existingProfileById } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Also check if profile exists by email (for migrated users from Supabase auth)
  const { data: existingProfileByEmail } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single()

  const existingProfile = existingProfileById || existingProfileByEmail

  if (existingProfile) {
    // If profile was found by email but has different ID (migration case from Supabase auth)
    if (existingProfile.id !== userId) {
      // Migrate data: update all related records to use new Clerk user ID
      await supabase
        .from("reviews")
        .update({ user_id: userId })
        .eq("user_id", existingProfile.id)
      
      await supabase
        .from("flags")
        .update({ user_id: userId })
        .eq("user_id", existingProfile.id)
      
      // Delete old profile and create new one with Clerk ID
      await supabase
        .from("profiles")
        .delete()
        .eq("id", existingProfile.id)
      
      // Create new profile with Clerk ID, preserving role
      const { data: migratedProfile, error: migrateError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          role: existingProfile.role, // Preserve existing role (owner/admin/user)
        })
        .select()
        .single()
      
      if (migrateError) {
        console.error("Error migrating profile:", migrateError)
        return null
      }
      
      return migratedProfile
    }

    // Profile ID matches, just update if needed
    const updates: { email?: string; role?: string } = {}
    
    if (existingProfile.email !== email) {
      updates.email = email
    }
    
    // If email is in owner_emails but profile isn't owner, upgrade to owner
    if (ownerEmail && existingProfile.role !== "owner") {
      updates.role = "owner"
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
      
      // Return updated profile
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      
      return updatedProfile || existingProfile
    }
    
    return existingProfile
  }

  // Create new profile with appropriate role
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: email,
      role: role,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    return null
  }

  return newProfile
}

/**
 * Gets the current user's Supabase profile, syncing if necessary
 */
export async function getCurrentUserProfile() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const supabase = await createClient()
  
  // Try to get existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // If profile doesn't exist, sync it
  if (!profile) {
    return await syncUserWithSupabase()
  }

  return profile
}

