// From app/admin/courses/create/page.tsx - Line 400+

// Example scenario:
const title = "Yoga Basics"
const selectedBatches = ["1", "2", "3"] // Morning batches
const selectedSubscriptions = ["101", "102"] // Basic & Premium plans
const youtubeLink = "https://youtube.com/watch?v=abc123"

// Declare the supabase variable
const supabase = {} // initialize your supabase client here

// The system creates course entries like this:
const courseEntries = []

for (const subscriptionId of selectedSubscriptions) {
  for (const batchNumber of selectedBatches) {
    const batchCourseData = {
      title: "Yoga Basics",
      youtube_link: youtubeLink,
      batch_number: batchNumber,
      subscription_id: Number.parseInt(subscriptionId),
      // ... other fields
    }
    courseEntries.push(batchCourseData)
  }
}

// Result: courseEntries array has 6 objects
console.log("Creating", courseEntries.length, "course entries")
// Output: "Creating 6 course entries"

// Database insert creates 6 separate records with unique IDs:
const { data, error } = await supabase.from("courses").insert(courseEntries).select()

// Database assigns unique IDs: 1, 2, 3, 4, 5, 6
