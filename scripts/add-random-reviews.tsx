"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CheckCircle2, AlertCircle } from "lucide-react"

// Array of Indian names that might be in your database
const indianNames = [
  "Aarav Sharma",
  "Aditi Patel",
  "Arjun Singh",
  "Ananya Desai",
  "Aryan Mehta",
  "Diya Verma",
  "Ishaan Kumar",
  "Kavya Gupta",
  "Vihaan Reddy",
  "Zara Khan",
  "Reyansh Joshi",
  "Saanvi Malhotra",
  "Vivaan Choudhury",
  "Anika Kapoor",
  "Advait Mishra",
  "Myra Agarwal",
  "Dhruv Chauhan",
  "Ira Saxena",
  "Kabir Yadav",
  "Kiara Bose",
  "Arnav Banerjee",
  "Pari Mehra",
  "Ayaan Nair",
  "Anvi Iyer",
  "Rudra Thakur",
  "Amaira Bhat",
  "Shaurya Menon",
  "Aadhya Pillai",
  "Krish Rajan",
  "Navya Hegde",
  "Rishaan Chakraborty",
  "Avni Trivedi",
  "Pranav Venkatesh",
  "Kyra Goswami",
  "Veer Mistry",
  "Shanaya Shetty",
  "Atharv Naidu",
  "Ishita Chowdhury",
  "Aarush Rao",
  "Trisha Mukherjee",
  "Darsh Khanna",
  "Ahana Sengupta",
  "Reyansh Basu",
  "Prisha Chatterjee",
  "Virat Ganguly",
  "Riya Bhattacharya",
  "Aaryan Dutta",
  "Anvi Ghosh",
  "Kabir Dasgupta",
  "Aanya Roy",
]

// Yoga-related review content
const yogaReviewContent = [
  "The morning yoga sessions have transformed my daily routine. I feel more energetic and focused throughout the day.",
  "I've been practicing yoga for years, but these sessions taught me new techniques that have improved my practice.",
  "The instructors are excellent and the course content is well-structured. Highly recommended for beginners!",
  "I was skeptical at first, but after a month of regular practice, my back pain has significantly reduced.",
  "The online platform is easy to navigate, and the video quality is excellent. I can follow along without any issues.",
  "I appreciate the variety of classes offered. From gentle yoga to more challenging sessions, there's something for everyone.",
  "The meditation techniques taught in the sessions have helped me manage my stress levels better.",
  "I've noticed improved flexibility and strength since I started these yoga classes.",
  "The instructors provide clear instructions and modifications for different skill levels.",
  "The breathing exercises have helped me improve my respiratory health and sleep quality.",
  "I love the convenience of being able to practice yoga at home with professional guidance.",
  "The community aspect of the platform is great. I feel connected to fellow practitioners despite being online.",
  "The holistic approach to wellness, combining yoga with nutrition advice, has been very beneficial.",
  "I've lost weight and gained muscle tone since starting these yoga sessions.",
  "The spiritual aspects of yoga are well-explained without being overwhelming.",
  "My posture has improved significantly after just a few weeks of regular practice.",
  "The instructors are very responsive to questions and provide personalized feedback.",
  "I appreciate the cultural context provided for various yoga practices and traditions.",
  "The platform offers great value for money compared to in-person yoga classes.",
  "I've recommended these yoga sessions to all my friends and family members.",
  "The schedule flexibility allows me to practice yoga despite my busy work life.",
  "I've noticed improved digestion and overall gut health since starting yoga.",
  "The yoga philosophy discussions have given me new perspectives on life.",
  "The platform's interface is user-friendly and makes tracking my progress easy.",
  "I feel more balanced emotionally and mentally since incorporating these yoga practices.",
  "The instructors' calm and encouraging teaching style makes the sessions enjoyable.",
  "I've developed a consistent yoga practice thanks to the engaging content.",
  "The combination of asanas, pranayama, and meditation is perfectly balanced.",
  "My concentration and focus have improved at work since starting these yoga sessions.",
  "I appreciate the attention to proper alignment and safety in all the classes.",
  "The yoga sessions have helped me connect better with my body and its needs.",
  "I've experienced fewer headaches and migraines since starting regular yoga practice.",
  "The variety of session lengths makes it easy to fit yoga into any schedule.",
  "I feel more confident and self-aware since beginning this yoga journey.",
  "The platform's community features make me feel supported in my practice.",
  "I've noticed improved joint mobility and less stiffness in the mornings.",
  "The instructors' knowledge of anatomy helps me understand the benefits of each pose.",
  "I sleep better and wake up more refreshed since starting evening yoga sessions.",
  "The platform's progress tracking features keep me motivated to continue practicing.",
  "I appreciate the seasonal and special event yoga sessions that keep things interesting.",
  "My blood pressure has normalized since I started practicing yoga regularly.",
  "The mindfulness techniques have helped me become more present in my daily life.",
  "I feel a greater sense of inner peace and contentment since starting yoga.",
  "The platform's accessibility features make yoga available to everyone.",
  "I've developed better eating habits inspired by the yoga philosophy teachings.",
  "My relationships have improved as I've become more patient and mindful.",
  "The yoga sessions have helped me recover from a sports injury faster than expected.",
  "I appreciate the cultural respect shown in the teaching of traditional yoga practices.",
  "The platform's offline download feature allows me to practice even when traveling.",
  "I've found a supportive community that encourages my wellness journey.",
]

export default function AddRandomReviews() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addedCount, setAddedCount] = useState(0)

  const addReviews = async () => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)
    setAddedCount(0)

    try {
      const supabase = getSupabaseBrowserClient()
      let successCount = 0

      // Generate 43 random reviews
      const reviews = []
      for (let i = 0; i < 43; i++) {
        // Randomly select a name and review content
        const randomNameIndex = Math.floor(Math.random() * indianNames.length)
        const randomContentIndex = Math.floor(Math.random() * yogaReviewContent.length)

        // Generate a random rating between 3 and 5 (mostly positive reviews)
        // With a small chance (10%) of a rating between 1 and 2
        let rating
        if (Math.random() < 0.1) {
          rating = Math.floor(Math.random() * 2) + 1 // 1 or 2
        } else {
          rating = Math.floor(Math.random() * 3) + 3 // 3, 4, or 5
        }

        // Determine if the review should be featured (20% chance)
        const isFeatured = Math.random() < 0.2

        // Create the review object
        reviews.push({
          name: indianNames[randomNameIndex],
          rating,
          review_text: yogaReviewContent[randomContentIndex],
          is_featured: isFeatured,
          is_published: true, // All reviews are published by default
        })
      }

      // Insert reviews in batches of 10 to avoid timeouts
      const batchSize = 10
      for (let i = 0; i < reviews.length; i += batchSize) {
        const batch = reviews.slice(i, i + batchSize)

        const { data, error: insertError } = await supabase.from("reviews").insert(batch).select()

        if (insertError) {
          console.error("Error inserting batch:", insertError)
          setError(`Error adding reviews: ${insertError.message}`)
        } else {
          successCount += batch.length
          setAddedCount(successCount)
        }
      }

      setSuccess(`Successfully added ${successCount} random reviews to the database.`)
    } catch (err) {
      console.error("Error adding reviews:", err)
      setError(`An unexpected error occurred: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add Random Reviews</CardTitle>
        <CardDescription>
          This tool will add 43 random yoga-related reviews to your database using Indian names.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Click the button below to generate and add 43 random reviews to your database. This will:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Use common Indian names</li>
          <li>Generate realistic yoga-related review content</li>
          <li>Assign ratings (mostly 3-5 stars with some 1-2 star reviews)</li>
          <li>Mark approximately 20% of reviews as featured</li>
          <li>Set all reviews as published</li>
        </ul>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isLoading && addedCount > 0 && (
          <div className="mb-4">
            <p>Progress: Added {addedCount} reviews so far...</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={addReviews} disabled={isLoading} className="w-full">
          {isLoading ? "Adding Reviews..." : "Add 43 Random Reviews"}
        </Button>
      </CardFooter>
    </Card>
  )
}
