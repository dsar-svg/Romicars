import { query } from '../database';

export async function getProductosMasVendidos(limit: number = 10) {
  const rows = await query(
    `SELECT p.codigo, p.descripcion, SUM(dv.cantidad) as total_vendido
     FROM profit.detalle_venta dv
     JOIN profit.productos p ON p.codigo = dv.codigo_producto
     GROUP BY p.codigo, p.descripcion
     ORDER BY total_vendido DESC
     LIMIT ?`, [limit]
  );
  return rows;
}

export async function getProductosMenosVendidos(limit: number = 10) {
  const rows = await query(
    `SELECT p.codigo, p.descripcion, SUM(dv.cantidad) as total_vendido
     FROM profit.detalle_venta dv
     JOIN profit.productos p ON p.codigo = dv.codigo_producto
     GROUP BY p.codigo, p.descripcion
     ORDER BY total_vendido ASC
     LIMIT ?`, [limit]
  );
  return rows;
}

export async function getTotalFacturado() {
  const [rows] = await query(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as facturas
     FROM profit.facturas
     WHERE fecha >= NOW() - INTERVAL 30 DAY`
  ) as any[];
  return { total: rows?.total || 0, facturas: rows?.facturas || 0 };
}

export async function getClientesConCoordenadas() {
  const rows = await query(
    `SELECT codigo, nombre, direccion, coordenadas
     FROM clientes
     WHERE coordenadas IS NOT NULL AND coordenadas != ''
     LIMIT 500`
  );
  return rows;
}
