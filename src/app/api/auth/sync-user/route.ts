import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 })
    }

    const supabase = await createClient()

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
      // If profile was found by email but has different ID (migration case), update the ID
      if (existingProfile.id !== userId) {
        // First, we need to handle any foreign key constraints
        // Update reviews to use new user_id
        await supabase
          .from("reviews")
          .update({ user_id: userId })
          .eq("user_id", existingProfile.id)
        
        // Update flags to use new user_id
        await supabase
          .from("flags")
          .update({ user_id: userId })
          .eq("user_id", existingProfile.id)
        
        // Delete old profile and create new one with Clerk ID
        await supabase
          .from("profiles")
          .delete()
          .eq("id", existingProfile.id)
        
        // Create new profile with Clerk ID
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: email,
            role: existingProfile.role, // Preserve existing role
          })
          .select()
          .single()
        
        if (createError) {
          console.error("Error creating migrated profile:", createError)
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, profile: newProfile })
      }

      // Update email if it changed, and update role if user is now an owner
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
        
        return NextResponse.json({ success: true, profile: updatedProfile || existingProfile })
      }
      
      return NextResponse.json({ success: true, profile: existingProfile })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (error) {
    console.error("Error syncing user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

