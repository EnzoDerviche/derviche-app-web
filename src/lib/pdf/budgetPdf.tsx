import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Budget, BudgetItem, Client, Payment, ClientAddress } from "@/types";
import { PAYMENT_STATUS_META } from "@/constants/statuses";

const ORANGE = "#f59e0b";
const DARK = "#1c1917";
const GRAY = "#78716c";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: DARK, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 3, borderBottomColor: ORANGE, paddingBottom: 10, marginBottom: 16 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  brandAccent: { color: ORANGE },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  muted: { color: GRAY },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4, textTransform: "uppercase", color: GRAY },
  row: { flexDirection: "row" },
  col2: { width: "50%" },
  tableHeader: { flexDirection: "row", backgroundColor: DARK, color: "#fff", paddingVertical: 5, paddingHorizontal: 4, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e7e5e4", paddingVertical: 5, paddingHorizontal: 4 },
  cDesc: { width: "44%" },
  cQty: { width: "12%", textAlign: "right" },
  cUnit: { width: "12%", textAlign: "center" },
  cPrice: { width: "16%", textAlign: "right" },
  cSub: { width: "16%", textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalFinal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: DARK, marginTop: 3, fontFamily: "Helvetica-Bold", fontSize: 12 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, borderTopWidth: 0.5, borderTopColor: "#e7e5e4", paddingTop: 6, fontSize: 8, color: GRAY, textAlign: "center" },
});

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
const date = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export interface BudgetPdfData {
  budget: Budget;
  client: Client;
  items: BudgetItem[];
  payments: Payment[];
  address?: ClientAddress | null;
  logo?: string;
}

export function BudgetPdf({ budget, client, items, payments, address, logo }: BudgetPdfData) {
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, Number(budget.total) - paid);

  return (
    <Document title={budget.budget_number} author="Derviche Construcciones">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={logo} style={{ width: 48, height: 48, marginRight: 10 }} /> : null}
            <View>
              <Text style={s.brand}>
                DERVICHE <Text style={s.brandAccent}>CONSTRUCCIONES</Text>
              </Text>
              <Text style={s.muted}>Presupuesto de obra</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>{budget.budget_number}</Text>
            <Text style={[s.muted, { textAlign: "right" }]}>Fecha: {date(budget.created_at)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cliente</Text>
          <View style={s.row}>
            <View style={s.col2}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{client.first_name} {client.last_name}</Text>
              {client.company ? <Text style={s.muted}>{client.company}</Text> : null}
              {client.tax_id ? <Text style={s.muted}>CUIT/DNI: {client.tax_id}</Text> : null}
            </View>
            <View style={s.col2}>
              {client.phone ? <Text style={s.muted}>Tel: {client.phone}</Text> : null}
              {client.email ? <Text style={s.muted}>{client.email}</Text> : null}
              {client.address ? <Text style={s.muted}>{client.address}{client.city ? `, ${client.city}` : ""}</Text> : null}
            </View>
          </View>
          {address ? (
            <Text style={{ marginTop: 4 }}>
              <Text style={s.muted}>Dirección: </Text>
              {address.address}{address.city ? `, ${address.city}` : ""}
            </Text>
          ) : null}
        </View>

        {budget.notes ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Trabajo a realizar</Text>
            <Text>{budget.notes}</Text>
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle</Text>
          <View style={s.tableHeader}>
            <Text style={s.cDesc}>Descripción</Text>
            <Text style={s.cQty}>Cant.</Text>
            <Text style={s.cUnit}>Unidad</Text>
            <Text style={s.cPrice}>P. unit.</Text>
            <Text style={s.cSub}>Subtotal</Text>
          </View>
          {items.map((it) => (
            <View style={s.tableRow} key={it.id}>
              <Text style={s.cDesc}>{it.description}</Text>
              <Text style={s.cQty}>{Number(it.quantity)}</Text>
              <Text style={s.cUnit}>{it.unit}</Text>
              <Text style={s.cPrice}>{money(Number(it.unit_price))}</Text>
              <Text style={s.cSub}>{money(Number(it.subtotal))}</Text>
            </View>
          ))}

          <View style={s.totals}>
            <View style={s.totalRow}><Text>Subtotal</Text><Text>{money(Number(budget.subtotal))}</Text></View>
            {Number(budget.discount) > 0 && (
              <View style={s.totalRow}><Text>Descuento</Text><Text>- {money(Number(budget.discount))}</Text></View>
            )}
            {Number(budget.tax) > 0 && (
              <View style={s.totalRow}><Text>IVA</Text><Text>{money(Number(budget.tax))}</Text></View>
            )}
            <View style={s.totalFinal}><Text>TOTAL</Text><Text>{money(Number(budget.total))}</Text></View>
          </View>
        </View>

        {payments.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Pagos</Text>
            <View style={s.totals}>
              <View style={s.totalRow}><Text>Total pagado</Text><Text>{money(paid)}</Text></View>
              <View style={s.totalRow}><Text>Saldo pendiente</Text><Text>{money(balance)}</Text></View>
              <View style={s.totalRow}><Text style={s.muted}>Estado de pago</Text><Text style={s.muted}>{PAYMENT_STATUS_META[budget.payment_status].label}</Text></View>
            </View>
          </View>
        )}

        <Text style={s.footer}>
          Derviche Construcciones · Presupuesto válido por 15 días · Condiciones de pago a convenir
        </Text>
      </Page>
    </Document>
  );
}
