import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Indian names for reviews
const indianNames = [
  "Aarav Sharma",
  "Aditi Patel",
  "Arjun Singh",
  "Ananya Desai",
  "Aryan Mehta",
  "Diya Verma",
  "Ishaan Gupta",
  "Kavya Joshi",
  "Vihaan Malhotra",
  "Zara Khan",
  "Reyansh Kumar",
  "Saanvi Reddy",
  "Vivaan Choudhury",
  "Anika Kapoor",
  "Advait Mishra",
  "Myra Agarwal",
  "Dhruv Chauhan",
  "Ira Saxena",
  "Kabir Yadav",
  "Kiara Bose",
  "Arnav Thakur",
  "Pari Banerjee",
  "Ayaan Nair",
  "Anvi Iyer",
  "Rudra Mehra",
  "Amaira Bhat",
  "Shaurya Menon",
  "Aadhya Pillai",
  "Atharv Hegde",
  "Avni Chakraborty",
  "Krish Rajan",
  "Kyra Venkatesh",
  "Rishaan Khanna",
  "Shanaya Mukherjee",
  "Ved Sharma",
  "Tara Patel",
  "Virat Singh",
  "Riya Desai",
  "Aniket Mehta",
  "Navya Verma",
  "Rohan Gupta",
  "Siya Joshi",
  "Aditya Malhotra",
  "Aisha Khan",
  "Veer Kumar",
  "Prisha Reddy",
  "Parth Choudhury",
  "Mira Kapoor",
  "Ishita Mishra",
  "Aarush Agarwal",
]

// Yoga-related review texts
const reviewTexts = [
  "The morning yoga sessions have completely transformed my daily routine. I feel more energetic and focused throughout the day.",
  "I've been practicing yoga for years, but these classes taught me new techniques that have improved my practice significantly.",
  "The instructors are excellent and the course content is well-structured. Highly recommended for beginners!",
  "I was skeptical at first, but after just two weeks, I noticed a significant improvement in my flexibility and posture.",
  "The meditation techniques taught in the advanced classes have helped me manage my stress levels better than any other method I've tried.",
  "I appreciate how the instructors modify poses for different ability levels. Makes me feel comfortable as a beginner.",
  "The online platform is easy to navigate, and the video quality is excellent. I never miss my favorite sessions.",
  "I've tried many yoga programs, but this one stands out for its authentic approach to traditional yoga practices.",
  "The combination of asanas and pranayama in the morning batch has improved my respiratory health noticeably.",
  "My back pain has reduced significantly since I started the therapeutic yoga sessions. Thank you!",
  "The community aspect of these classes is wonderful. I've made new friends who share my interest in yoga.",
  "I love how the instructors explain the philosophy behind each practice. It's not just exercise; it's a way of life.",
  "The evening relaxation sessions have helped me overcome my insomnia. I now sleep better than I have in years.",
  "As a busy professional, the flexible scheduling options have made it possible for me to maintain a consistent practice.",
  "The special workshops on specific asanas have deepened my understanding of yoga beyond what regular classes could offer.",
  "I've lost 5 kg since joining three months ago, and I feel stronger and more confident in my body.",
  "The personalized feedback from instructors has helped me correct my alignment issues that other classes never addressed.",
  "My concentration at work has improved dramatically since I started the mindfulness sessions.",
  "The variety of classes keeps things interesting. I never get bored with my practice.",
  "I appreciate the emphasis on proper breathing techniques. It's made a huge difference in how I experience the poses.",
  "The instructors create such a peaceful atmosphere. It's my sanctuary from the chaos of daily life.",
  "I've noticed improved digestion and better eating habits since incorporating yoga into my daily routine.",
  "The chanting sessions have opened up a spiritual dimension to my practice that I hadn't experienced before.",
  "As someone with joint issues, I appreciate how the instructors offer modifications that make yoga accessible for me.",
  "My flexibility has improved so much that I can finally touch my toes for the first time in my adult life!",
  "The philosophy discussions after practice have given me new perspectives on how to approach challenges in my life.",
  "I've become more patient with my family since starting meditation. My relationships have improved as a result.",
  "The prenatal yoga classes helped me stay active throughout my pregnancy and prepared me for labor.",
  "I recovered from my sports injury much faster with the therapeutic yoga program than with physical therapy alone.",
  "The kids' yoga classes have helped my child improve focus and behavior at school. We now practice together at home.",
  "I appreciate the authentic approach to yoga that honors its Indian roots and traditions.",
  "The advanced inversions workshop gave me the confidence to try poses I never thought I could do.",
  "My posture has improved dramatically. My colleagues have noticed I stand taller in meetings.",
  "The breathing exercises have helped me manage my anxiety attacks better than medication ever did.",
  "I love starting my day with sun salutations. It sets a positive tone for everything that follows.",
  "The yoga nidra sessions have given me deeper rest than regular sleep. I wake up feeling completely refreshed.",
  "As a senior citizen, I appreciate how the gentle yoga classes have improved my balance and prevented falls.",
  "The instructors' knowledge of anatomy has helped me understand how to work with my body's limitations.",
  "I've developed greater body awareness that has improved my performance in other sports and activities.",
  "The online community support keeps me motivated even when I can't attend in-person sessions.",
  "The seasonal retreats have been transformative experiences that deepen my practice beyond regular classes.",
  "I appreciate the holistic approach that addresses physical, mental, and spiritual well-being.",
  "The chakra balancing workshops have helped me understand energy flow in my body in a whole new way.",
  "I've learned to be more mindful in everyday activities, not just during formal practice sessions.",
  "The combination of yoga and Ayurvedic principles has helped me establish a healthier lifestyle overall.",
  "I'm grateful for how accessible the teachers make the ancient wisdom of yoga to modern practitioners.",
  "The partner yoga workshops have strengthened my relationship with my spouse in unexpected ways.",
  "I've gained confidence in my body's capabilities that has extended to other areas of my life.",
  "The yoga philosophy has given me tools to remain calm in stressful situations at work and home.",
  "I appreciate how the practice evolves with me as I progress. There's always something new to learn.",
]

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // First, check if we already have reviews in the database
    const { count, error: countError } = await supabaseAdmin.from("reviews").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error checking existing reviews:", countError)
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 })
    }

    // If we already have 43 or more reviews, don't add more
    if (count && count >= 43) {
      return NextResponse.json({
        success: true,
        message: `Already have ${count} reviews in the database. No new reviews added.`,
        count,
      })
    }

    // Prepare the reviews to insert
    const reviewsToInsert = []
    const numToInsert = 43 - (count || 0)

    for (let i = 0; i < numToInsert; i++) {
      const nameIndex = Math.floor(Math.random() * indianNames.length)
      const textIndex = Math.floor(Math.random() * reviewTexts.length)
      const rating = Math.floor(Math.random() * 2) + 4 // Ratings 4-5 for mostly positive reviews

      reviewsToInsert.push({
        name: indianNames[nameIndex],
        rating,
        review_text: reviewTexts[textIndex],
        is_published: true,
        is_featured: rating === 5 && Math.random() < 0.3, // 30% of 5-star reviews are featured
        created_at: new Date().toISOString(),
      })
    }

    // Insert the reviews
    if (reviewsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("reviews").insert(reviewsToInsert)

      if (insertError) {
        console.error("Error inserting reviews:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
    }

    // Get the new count
    const { count: newCount } = await supabaseAdmin.from("reviews").select("*", { count: "exact", head: true })

    return NextResponse.json({
      success: true,
      message: `Successfully added ${reviewsToInsert.length} new reviews. Total: ${newCount}`,
      added: reviewsToInsert.length,
      total: newCount,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
