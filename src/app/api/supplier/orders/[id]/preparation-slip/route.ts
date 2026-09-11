import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePackageCode } from '@/lib/delivery';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { data: order, error } = await supabase
      .from('supplier_orders')
      .select(`
        id,
        supplier_order_number,
        created_at,
        status,
        items:supplier_order_items(
          product_name,
          product_sku,
          variant_info,
          quantity
        )
      `)
      .eq('id', id)
      .eq('supplier_id', user.id)
      .single();
    
    if (error || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    const { data: supplierProfile } = await supabase
      .from('supplier_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single();
    
    const packageCode = generatePackageCode(order.id);
    const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    
    const html = generatePreparationSlipHTML({
      orderNumber: order.supplier_order_number,
      date: new Date(order.created_at).toLocaleDateString('fr-FR'),
      supplierName: supplierProfile?.company_name || 'Fournisseur',
      items: order.items,
      packageCode,
      totalItems,
    });
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating preparation slip:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function generatePreparationSlipHTML(data: {
  orderNumber: string;
  date: string;
  supplierName: string;
  items: any[];
  packageCode: string;
  totalItems: number;
}): string {
  const itemsRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${item.product_sku || '-'}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${item.product_name}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${item.variant_info?.size || '-'}</td>
      <td style="padding: 12px; border: 1px solid #ddd;">${item.variant_info?.color || '-'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bon de Préparation - ${data.orderNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #6366f1;
        }
        .order-info {
          text-align: right;
        }
        .title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin: 30px 0;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .supplier-info {
          margin-bottom: 30px;
          padding: 15px;
          background: #f0f9ff;
          border-radius: 8px;
        }
        .warning-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .warning-title {
          color: #92400e;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .warning-text {
          color: #78350f;
          font-size: 14px;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #f1f5f9;
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
          font-weight: bold;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          margin: 20px 0;
        }
        .package-code {
          text-align: center;
          margin: 40px 0;
          padding: 30px;
          background: #f8fafc;
          border: 2px dashed #6366f1;
          border-radius: 12px;
        }
        .package-code-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        .package-code-value {
          font-size: 32px;
          font-weight: bold;
          font-family: monospace;
          color: #6366f1;
          letter-spacing: 2px;
        }
        .package-code-note {
          font-size: 12px;
          color: #666;
          margin-top: 15px;
        }
        .instructions {
          background: #f0fdf4;
          border: 1px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .instructions-title {
          font-weight: bold;
          color: #166534;
          margin-bottom: 10px;
        }
        .instructions ul {
          margin: 0;
          padding-left: 20px;
          color: #166534;
        }
        .instructions li {
          margin: 8px 0;
        }
        .print-btn {
          display: block;
          width: 200px;
          margin: 30px auto;
          padding: 15px 30px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #4f46e5;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">DROPY</div>
        <div class="order-info">
          <div style="font-size: 14px; color: #666;">Date: ${data.date}</div>
          <div style="font-size: 18px; font-weight: bold;">N° ${data.orderNumber}</div>
        </div>
      </div>

      <div class="title">BON DE PRÉPARATION</div>

      <div class="supplier-info">
        <strong>Fournisseur:</strong> ${data.supplierName}
      </div>

      <div class="warning-box">
        <div class="warning-title">⚠️ IMPORTANT - CONFIDENTIALITÉ</div>
        <div class="warning-text">
          <strong>❌ ADRESSE CLIENT: NON VISIBLE</strong><br>
          <strong>❌ NOM CLIENT: NON VISIBLE</strong><br>
          <strong>❌ TÉLÉPHONE CLIENT: NON VISIBLE</strong><br><br>
          Les informations du client sont gérées par Dropy. La société de livraison s'occupera de l'enlèvement et de la livraison.
        </div>
      </div>

      <h3 style="margin-top: 30px;">PRODUITS À PRÉPARER:</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">QTÉ</th>
            <th style="width: 120px;">RÉFÉRENCE</th>
            <th>PRODUIT</th>
            <th style="width: 80px;">TAILLE</th>
            <th style="width: 100px;">COULEUR</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="total-row">
        TOTAL ARTICLES: ${data.totalItems}
      </div>

      <div class="instructions">
        <div class="instructions-title">📋 INSTRUCTIONS:</div>
        <ul>
          <li>Emballer soigneusement chaque article</li>
          <li>Coller l'étiquette DROPY sur le colis</li>
          <li>Marquer "Prêt à enlever" dans l'application</li>
          <li>Attendre l'enlèvement par la société de livraison</li>
        </ul>
      </div>

      <div class="package-code">
        <div class="package-code-title">📦 CODE COLIS DROPY</div>
        <div class="package-code-value">${data.packageCode}</div>
        <div class="package-code-note">Ce code sera scanné par le livreur lors de l'enlèvement</div>
      </div>

      <button class="print-btn no-print" onclick="window.print()">
        🖨️ Imprimer
      </button>
    </body>
    </html>
  `;
}
