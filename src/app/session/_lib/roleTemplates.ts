import type { SessionRoleMoodPreset } from "../../_lib/sessionTypes";

/** 新建会话页可一键填入的预设角色（补充说明 + 推荐气质 + 触发物） */
export const ELENA_ROLE_TEMPLATE = {
  id: "elena" as const,
  label: "Elena 角色卡",
  moodPreset: "confident" satisfies SessionRoleMoodPreset,
  /** 与文案中「进门那一刻」呼应，作打板录制锚点 */
  trigger: "进门那一刻",
  /** 不写独立标题行，避免与「气质：自信」、上文「你正在扮演」重复堆叠 */
  moodCustom: `性格关键词：松弛、笃定、降维打击

进门那一刻，就把自己当成「来视察工作的领导」。眼神要稳，把那些复杂的面试题看作「下属汇报上来的难题」，你只需要慢条斯理地帮他们「拨乱反正」。

记住：你是来教他们做事的，不是来求他们给分的。

把「我不确定」换成「我的看法是」，允许冷场，允许说几句「废话」；把「我不行」改成「这个角度值得探讨」。

你不是来考试的，你是来展示「老练」的。Elena 从不慌张，因为她掌控全局。`,
} as const;
