import fs from "fs";
import path from "path";

import type { GongwuyuanCollection, GongwuyuanDocItem } from "./gongwuyuanTypes";

export type { GongwuyuanCollection, GongwuyuanDocItem } from "./gongwuyuanTypes";
export { GONGWUYUAN_CATEGORY_OPTIONS } from "./gongwuyuanTypes";

const ALLOWED: ReadonlySet<GongwuyuanCollection> = new Set([
  "history_exams",
  "predict_exams",
  "predict_exams_simple",
  "predict_exams_story",
]);

/** 服务端读取 gongwuyuan下某一目录的全部 .md（按中文文件名排序） */
export function loadGongwuyuanDocs(collection: GongwuyuanCollection): GongwuyuanDocItem[] {
  if (!ALLOWED.has(collection)) {
    throw new Error(`Invalid gongwuyuan collection: ${collection}`);
  }
  const dir = path.join(process.cwd(), "gongwuyuan", collection);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const names = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

  return names.map((file) => {
    const label = file.replace(/\.md$/u, "");
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    return { id: file, label, content };
  });
}
