import { db } from "@bagcoin/db";
import {
  bankAccount,
  category,
  importLog,
  transaction,
} from "@bagcoin/db/schema";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

const CATEGORIZATION_RULES: {
  keywords: string[];
  categoryName: string;
  type: "expense" | "income";
}[] = [
  {
    keywords: [
      "ifood",
      "uber eats",
      "rappi",
      "restaurante",
      "lanchonete",
      "padaria",
    ],
    categoryName: "Alimentação",
    type: "expense",
  },
  {
    keywords: ["uber", "99", "taxi", "cabify", "estacionamento", "pedagio"],
    categoryName: "Transporte",
    type: "expense",
  },
  {
    keywords: [
      "aluguel",
      "condominio",
      "iptu",
      "conta luz",
      "conta agua",
      "conta gas",
      "energia",
    ],
    categoryName: "Moradia",
    type: "expense",
  },
  {
    keywords: ["farmacia", "drogasil", "hospital", "clinica", "medico"],
    categoryName: "Saúde",
    type: "expense",
  },
  {
    keywords: [
      "netflix",
      "spotify",
      "disney",
      "hbo",
      "amazon prime",
      "youtube",
      "apple",
    ],
    categoryName: "Assinaturas",
    type: "expense",
  },
  {
    keywords: [
      "supermercado",
      "extra",
      "carrefour",
      "pao de acucar",
      "assai",
      "atacadao",
    ],
    categoryName: "Supermercado",
    type: "expense",
  },
  {
    keywords: [
      "posto",
      "shell",
      "ipiranga",
      "br distribuidora",
      "combustivel",
      "gasolina",
    ],
    categoryName: "Combustível",
    type: "expense",
  },
  {
    keywords: ["salario", "pagamento", "remuneracao", "adiantamento", "folha"],
    categoryName: "Salário",
    type: "income",
  },
  {
    keywords: [
      "pix recebido",
      "transferencia recebida",
      "ted recebida",
      "doc recebido",
    ],
    categoryName: "Transferências",
    type: "income",
  },
  {
    keywords: ["rendimento", "dividendo", "juros", "investimento"],
    categoryName: "Investimentos",
    type: "income",
  },
];

const BR_DATE_RE = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
const NEWLINE_RE = /\r?\n/;
const OFX_BRACKET_RE = /\[.*\]/;
const OFX_OPEN_RE = /<STMTTRN>/i;
const OFX_CLOSE_RE = /<\/STMTTRN>/i;

const DATE_HINTS = ["data", "date", "dt", "dia"];
const DESC_HINTS = [
  "descricao",
  "description",
  "desc",
  "historico",
  "memo",
  "lancamento",
];
const VALUE_HINTS = ["valor", "value", "amount", "quantia", "montante"];
const TYPE_HINTS = ["tipo", "type", "natureza", "dc"];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectDelimiter(line: string): string {
  const semicolonCount = (line.match(/;/g) ?? []).length;
  const commaCount = (line.match(/,/g) ?? []).length;
  const tabCount = (line.match(/\t/g) ?? []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    return "\t";
  }
  if (semicolonCount > commaCount) {
    return ";";
  }
  return ",";
}

function detectMapping(columns: string[]) {
  const normalized = columns.map((c) => normalizeText(c.trim()));

  const find = (hints: string[]): string | null => {
    const idx = normalized.findIndex((col) =>
      hints.some((h) => col.includes(h))
    );
    return idx >= 0 ? (columns[idx]?.trim() ?? null) : null;
  };

  return {
    date: find(DATE_HINTS),
    description: find(DESC_HINTS),
    value: find(VALUE_HINTS),
    type: find(TYPE_HINTS),
  };
}

function parseAmountString(value: string): number {
  let cleaned = value.replace(/[^\d,.-]/g, "");

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, "");
  } else {
    cleaned = cleaned.replace(",", ".");
  }

  return Math.round(Number.parseFloat(cleaned) * 100);
}

function parseDateString(value: string): Date {
  const trimmed = value.trim();
  const brMatch = BR_DATE_RE.exec(trimmed);
  if (brMatch) {
    return new Date(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1])
    );
  }
  return new Date(trimmed);
}

function parseCSV(content: string) {
  const lines = content
    .split(NEWLINE_RE)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { columns: [] as string[], rows: [] as Record<string, string>[] };
  }

  const firstLine = lines[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const columns = firstLine.split(delimiter).map((c) => c.trim());

  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const row: Record<string, string> = {};
    for (const [i, col] of columns.entries()) {
      row[col] = (values[i] ?? "").trim();
    }
    return row;
  });

  return { columns, rows };
}

function extractOFXTag(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\n]+)`, "i");
  const match = regex.exec(block);
  return match?.[1]?.trim() ?? null;
}

function parseOFXDate(value: string): Date {
  const clean = value.replace(OFX_BRACKET_RE, "").trim();
  return new Date(
    Number(clean.substring(0, 4)),
    Number(clean.substring(4, 6)) - 1,
    Number(clean.substring(6, 8))
  );
}

function parseOFX(content: string) {
  const columns = ["date", "description", "amount", "type"];
  const rows: Record<string, string>[] = [];

  const blocks = content.split(OFX_OPEN_RE).slice(1);

  for (const rawBlock of blocks) {
    const block = rawBlock.split(OFX_CLOSE_RE)[0] ?? "";
    const trnType = extractOFXTag(block, "TRNTYPE") ?? "";
    const dtPosted = extractOFXTag(block, "DTPOSTED") ?? "";
    const trnAmt = extractOFXTag(block, "TRNAMT") ?? "0";
    const memo =
      extractOFXTag(block, "MEMO") ?? extractOFXTag(block, "NAME") ?? "";

    const amount = Number.parseFloat(trnAmt.replace(",", "."));
    const isExpense = trnType.toUpperCase() === "DEBIT" || amount < 0;
    const date = dtPosted ? parseOFXDate(dtPosted) : new Date();

    rows.push({
      date: date.toISOString().split("T")[0] ?? "",
      description: memo,
      amount: String(Math.abs(amount)),
      type: isExpense ? "expense" : "income",
    });
  }

  return {
    columns,
    rows,
    mapping: {
      date: "date",
      description: "description",
      value: "amount",
      type: "type",
    },
  };
}

interface ParsedTransaction {
  amount: number;
  date: string;
  description: string;
  type: "expense" | "income";
}

function buildTransactions(
  rows: Record<string, string>[],
  mapping: ReturnType<typeof detectMapping>
): ParsedTransaction[] {
  return rows
    .map((row) => {
      const dateStr = mapping.date ? row[mapping.date] : null;
      const desc = mapping.description ? row[mapping.description] : null;
      const valueStr = mapping.value ? row[mapping.value] : null;
      const typeStr = mapping.type ? row[mapping.type] : null;

      if (!(dateStr && desc && valueStr)) {
        return null;
      }

      const rawAmount = parseAmountString(valueStr);
      const normalizedType = normalizeText(typeStr ?? "");
      const isExpense = typeStr
        ? normalizedType === "expense" ||
          normalizedType.includes("deb") ||
          normalizedType.includes("saida") ||
          normalizedType === "d"
        : rawAmount < 0;

      const date = parseDateString(dateStr);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return {
        date: date.toISOString(),
        description: desc.trim(),
        amount: Math.abs(rawAmount),
        type: (isExpense ? "expense" : "income") as "expense" | "income",
      };
    })
    .filter((item): item is ParsedTransaction => item !== null);
}

function computeSummary(txns: ParsedTransaction[]) {
  let expenses = 0;
  let income = 0;
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  for (const txn of txns) {
    if (txn.type === "expense") {
      expenses++;
    } else {
      income++;
    }
    if (!periodStart || txn.date < periodStart) {
      periodStart = txn.date;
    }
    if (!periodEnd || txn.date > periodEnd) {
      periodEnd = txn.date;
    }
  }

  return { total: txns.length, expenses, income, periodStart, periodEnd };
}

interface CategoryRow {
  id: string;
  name: string;
  type: "expense" | "income";
}

function autoCategorize(
  description: string,
  type: "expense" | "income",
  categories: CategoryRow[]
): string | null {
  const normalized = normalizeText(description);

  for (const rule of CATEGORIZATION_RULES) {
    if (rule.type !== type) {
      continue;
    }

    const matched = rule.keywords.some((kw) =>
      normalized.includes(normalizeText(kw))
    );
    if (!matched) {
      continue;
    }

    const cat = categories.find(
      (c) =>
        normalizeText(c.name) === normalizeText(rule.categoryName) &&
        c.type === type
    );
    if (cat) {
      return cat.id;
    }
  }

  return null;
}

export const importRoutes = new Elysia({ prefix: "/api/import" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .post(
    "/parse",
    async ({ userId, body, set }) => {
      const [account] = await db
        .select()
        .from(bankAccount)
        .where(
          and(
            eq(bankAccount.userId, userId),
            eq(bankAccount.id, body.bankAccountId)
          )
        );

      if (!account) {
        set.status = 404;
        return { error: "Bank account not found" };
      }

      let columns: string[];
      let rows: Record<string, string>[];
      let mapping: ReturnType<typeof detectMapping>;

      if (body.fileType === "csv") {
        const parsed = parseCSV(body.content);
        columns = parsed.columns;
        rows = parsed.rows;
        mapping = detectMapping(columns);
      } else {
        const parsed = parseOFX(body.content);
        columns = parsed.columns;
        rows = parsed.rows;
        mapping = parsed.mapping;
      }

      const parsedTxns = buildTransactions(rows, mapping);
      const summary = computeSummary(parsedTxns);

      return {
        data: {
          columns,
          preview: rows.slice(0, 10),
          mapping,
          transactions: parsedTxns,
          summary,
        },
      };
    },
    {
      body: t.Object({
        content: t.String(),
        fileType: t.Union([t.Literal("csv"), t.Literal("xml")]),
        bankAccountId: t.String(),
      }),
    }
  )
  .post(
    "/execute",
    async ({ userId, body, set }) => {
      const [account] = await db
        .select()
        .from(bankAccount)
        .where(
          and(
            eq(bankAccount.userId, userId),
            eq(bankAccount.id, body.bankAccountId)
          )
        );

      if (!account) {
        set.status = 404;
        return { error: "Bank account not found" };
      }

      const importId = crypto.randomUUID();
      const now = new Date();

      await db.insert(importLog).values({
        id: importId,
        userId,
        bankAccountId: body.bankAccountId,
        fileName: body.fileName,
        fileType: body.fileType,
        totalTransactions: body.transactions.length,
        status: "processing",
        createdAt: now,
      });

      const userCategories = await db
        .select({
          id: category.id,
          name: category.name,
          type: category.type,
        })
        .from(category)
        .where(or(eq(category.userId, userId), isNull(category.userId)));

      let imported = 0;
      let errors = 0;
      let categorized = 0;
      let balanceChange = 0;
      let periodStart: Date | null = null;
      let periodEnd: Date | null = null;

      for (const txn of body.transactions) {
        try {
          const txnDate = new Date(txn.date);
          const categoryId = autoCategorize(
            txn.description,
            txn.type,
            userCategories as CategoryRow[]
          );

          if (categoryId) {
            categorized++;
          }

          await db.insert(transaction).values({
            id: crypto.randomUUID(),
            userId,
            type: txn.type,
            amount: txn.amount,
            description: txn.description,
            date: txnDate,
            categoryId,
            bankAccountId: body.bankAccountId,
            importId,
            isImported: true,
            createdAt: now,
            updatedAt: now,
          });

          balanceChange += txn.type === "income" ? txn.amount : -txn.amount;

          if (!periodStart || txnDate < periodStart) {
            periodStart = txnDate;
          }
          if (!periodEnd || txnDate > periodEnd) {
            periodEnd = txnDate;
          }

          imported++;
        } catch {
          errors++;
        }
      }

      if (balanceChange !== 0) {
        await db
          .update(bankAccount)
          .set({
            balance: sql`${bankAccount.balance} + ${balanceChange}`,
            updatedAt: now,
          })
          .where(eq(bankAccount.id, body.bankAccountId));
      }

      await db
        .update(importLog)
        .set({
          importedCount: imported,
          errorCount: errors,
          periodStart,
          periodEnd,
          status:
            body.transactions.length > 0 && imported === 0
              ? "failed"
              : "completed",
        })
        .where(eq(importLog.id, importId));

      set.status = 201;
      return {
        data: {
          importId,
          imported,
          errors,
          categorized,
          uncategorized: imported - categorized,
        },
      };
    },
    {
      body: t.Object({
        bankAccountId: t.String(),
        fileName: t.String(),
        fileType: t.Union([t.Literal("csv"), t.Literal("xml")]),
        transactions: t.Array(
          t.Object({
            date: t.String(),
            description: t.String(),
            amount: t.Number(),
            type: t.Union([t.Literal("expense"), t.Literal("income")]),
          })
        ),
      }),
    }
  )
  .get(
    "/history",
    async ({ userId, query }) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
      const offset = (page - 1) * limit;

      const [countRow] = await db
        .select({ total: sql<number>`count(*)` })
        .from(importLog)
        .where(eq(importLog.userId, userId));

      const data = await db
        .select()
        .from(importLog)
        .where(eq(importLog.userId, userId))
        .orderBy(desc(importLog.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        meta: { total: countRow?.total ?? 0, page, limit },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ userId, params, set }) => {
    const [log] = await db
      .select()
      .from(importLog)
      .where(and(eq(importLog.userId, userId), eq(importLog.id, params.id)));

    if (!log) {
      set.status = 404;
      return { error: "Import not found" };
    }

    const importedTxns = await db
      .select()
      .from(transaction)
      .where(eq(transaction.importId, params.id))
      .orderBy(desc(transaction.date));

    return { data: { ...log, transactions: importedTxns } };
  });
