import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey || accessKey === "your_unsplash_access_key_here") {
    return NextResponse.json({ 
      error: "Clé API Unsplash non configurée. Veuillez ajouter UNSPLASH_ACCESS_KEY dans votre fichier .env.local",
      setup_required: true 
    }, { status: 200 }); // Return 200 so the UI can handle it gracefully
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${accessKey}`,
      {
        headers: {
          "Accept-Version": "v1",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.errors?.[0] || "Unsplash API error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
