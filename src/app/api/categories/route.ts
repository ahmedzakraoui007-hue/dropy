import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("product_categories")
      .select(`
        id,
        name,
        name_ar,
        slug,
        parent_id,
        icon,
        display_order,
        is_active
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rootCategories = categories?.filter((c) => !c.parent_id) || [];
    
    const buildTree = (parentId: string | null): any[] => {
      return categories
        ?.filter((c) => c.parent_id === parentId)
        .map((category) => ({
          ...category,
          children: buildTree(category.id),
        })) || [];
    };

    const tree = rootCategories.map((category) => ({
      ...category,
      children: buildTree(category.id),
    }));

    return NextResponse.json({ categories: tree });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
