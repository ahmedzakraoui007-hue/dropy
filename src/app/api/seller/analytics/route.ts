import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d"; // 24h, 7d, 30d, 12m
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller's store ID
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("seller_id", user.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = store.id;
    let startDate: Date;
    let days: number;

    switch (range) {
      case "24h":
        startDate = startOfDay(new Date());
        days = 1;
        break;
      case "30d":
        startDate = subDays(new Date(), 30);
        days = 30;
        break;
      case "12m":
        startDate = subDays(new Date(), 365);
        days = 365;
        break;
      default: // 7d
        startDate = subDays(new Date(), 7);
        days = 7;
    }

    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from("store_orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", startDate.toISOString());

    if (ordersError) throw ordersError;

    // Fetch visits
    const { data: visits, error: visitsError } = await supabase
      .from("store_visits")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", startDate.toISOString());

    if (visitsError) throw visitsError;

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalVisits = visits.length;
    const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

    // Process time series data
    const dateInterval = eachDayOfInterval({
      start: startDate,
      end: new Date(),
    });

    const chartData = dateInterval.map(date => {
      const dayStr = format(date, "yyyy-MM-dd");
      const dayOrders = orders.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === dayStr);
      const dayVisits = visits.filter(v => format(new Date(v.created_at), "yyyy-MM-dd") === dayStr);
      
      return {
        date: format(date, range === "12m" ? "MMM dd" : "dd MMM"),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        orders: dayOrders.length,
        visits: dayVisits.length,
      };
    });

    // Top Products
    const { data: topProductsData } = await supabase
      .from("store_order_items")
      .select("product_name, quantity, total_price, store_order_id")
      .in("store_order_id", orders.map(o => o.id));

    const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
    topProductsData?.forEach(item => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productStats[item.product_name].quantity += item.quantity;
      productStats[item.product_name].revenue += Number(item.total_price);
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Regions performance
    const regionStats: Record<string, { name: string, orders: number, revenue: number }> = {};
    orders.forEach(order => {
      const region = order.customer_governorate || "Inconnu";
      if (!regionStats[region]) {
        regionStats[region] = { name: region, orders: 0, revenue: 0 };
      }
      regionStats[region].orders += 1;
      regionStats[region].revenue += Number(order.total_amount);
    });

    const topRegions = Object.values(regionStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        revenue: totalRevenue,
        orders: totalOrders,
        aov: avgOrderValue,
        conversion: conversionRate,
        visits: totalVisits
      },
      chartData,
      topProducts,
      topRegions
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
