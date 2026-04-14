import { NextResponse } from "next/server";
import { z } from "zod";

import { loadGongwuyuanDocs } from "@/app/_lib/gongwuyuanDocs";

const collectionSchema = z.enum([
  "history_exams",
  "predict_exams",
  "predict_exams_simple",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("collection");
  const parsed = collectionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "缺少或无效的 collection 参数" },
      { status: 400 },
    );
  }
  try {
    const items = loadGongwuyuanDocs(parsed.data);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "读取文档失败" }, { status: 500 });
  }
}
