import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: categoryVariants, error: cvError } = await supabase
      .from("category_variants")
      .select(`
        id,
        is_required,
        display_order,
        variant_type_id,
        variant_types (
          id,
          name,
          name_ar,
          slug,
          input_type
        )
      `)
      .eq("category_id", id)
      .order("display_order", { ascending: true });

    if (cvError) {
      return NextResponse.json({ error: cvError.message }, { status: 500 });
    }

    const variantTypeIds = categoryVariants?.map((cv) => cv.variant_type_id) || [];

    const { data: options, error: optError } = await supabase
      .from("variant_options")
      .select("*")
      .in("variant_type_id", variantTypeIds)
      .order("display_order", { ascending: true });

    if (optError) {
      return NextResponse.json({ error: optError.message }, { status: 500 });
    }

    const variants = categoryVariants?.map((cv) => {
      const variantType = cv.variant_types as any;
      const variantOptions = options?.filter(
        (opt) => opt.variant_type_id === cv.variant_type_id
      );

      return {
        id: cv.id,
        variantTypeId: cv.variant_type_id,
        name: variantType?.name,
        nameAr: variantType?.name_ar,
        slug: variantType?.slug,
        inputType: variantType?.input_type,
        isRequired: cv.is_required,
        displayOrder: cv.display_order,
        options: variantOptions?.map((opt) => ({
          id: opt.id,
          value: opt.value,
          label: opt.label,
          hexColor: opt.hex_color,
          displayOrder: opt.display_order,
        })),
      };
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Error fetching category variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
