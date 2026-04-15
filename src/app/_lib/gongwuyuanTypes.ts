export type GongwuyuanCollection =
  | "history_exams"
  | "predict_exams"
  | "predict_exams_simple"
  | "predict_exams_story";

export type GongwuyuanDocItem = {
  id: string;
  label: string;
  content: string;
};

/** 悬浮真题入口：文档类目（可安全在客户端 import） */
export const GONGWUYUAN_CATEGORY_OPTIONS: {
  id: GongwuyuanCollection;
  title: string;
  hint: string;
}[] = [
  { id: "history_exams", title: "历史真题", hint: "历年题目与解析" },
  { id: "predict_exams", title: "预测题", hint: "趋势与模拟" },
  { id: "predict_exams_simple", title: "预测题（直白版）", hint: "口语化好记" },
  { id: "predict_exams_story", title: "预测题（故事版）", hint: "小故事好开口" },
];
