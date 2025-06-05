import { getSupabaseBrowserClient } from "@/lib/supabase"

async function fetchDetailPages() {
  const supabase = getSupabaseBrowserClient()
  const { data: detailPages, error } = await supabase.from("detail_pages").select("*")

  if (error) {
    console.error("Error fetching detail pages:", error)
    return []
  }

  return detailPages
}

export default async function PlansPage() {
  const detailPages = await fetchDetailPages()

  return (
    <div>
      <h1>Plans Page</h1>
      {detailPages.length > 0 ? (
        <ul>
          {detailPages.map((page) => (
            <li key={page.id}>{page.title}</li>
          ))}
        </ul>
      ) : (
        <p>No plans available.</p>
      )}
    </div>
  )
}
