import type { SessionRoleMoodPreset } from "../../../_lib/sessionTypes";

import { roleSectionTitles, ROLE_MOOD_LABELS } from "./roleCopy";

const MOOD_CUSTOM_MAX = 80;
const TRIGGER_MAX = 120;

export type BuildRoleCardInput = {
  moodPreset?: SessionRoleMoodPreset;
  moodCustom?: string;
  trigger: string;
};

/** 本地模板生成 ROLE-02 三块结构（无 HTML） */
export function buildRoleCardText(input: BuildRoleCardInput): string {
  const trigger = input.trigger.trim().slice(0, TRIGGER_MAX);
  const custom = (input.moodCustom ?? "").trim().slice(0, MOOD_CUSTOM_MAX);

  const presetPart = input.moodPreset ? ROLE_MOOD_LABELS[input.moodPreset] : "";
  const moodPieces = [presetPart, custom].filter(Boolean);
  const moodSummary = moodPieces.join("；") || "（未指定）";

  const stateBody = `你正在扮演「${moodSummary}」的答题者。手里（或心里）的锚点是「${trigger}」：每当紧张或脑子空白，先看它、摸它或默念它，把自己拉回角色，而不是退回自我审判。`;

  const actionsBody = `- 开口前用1 秒与「${trigger}」对齐：吸气，想象角色已接管身体。\n- 答题时语速与「${moodSummary}」一致；允许停顿，但不停在「我不行」上，而停在「角色在组织语言」。\n- 与考官眼神接触时，把视线当作对角色的反馈，不是对你的审判。\n- 每答完一小点，用「${trigger}」做一次微检查：是否还在角色里。`;

  const taboosBody = `- 禁止自我否定句式：「我不太会」「我说不好」「其实我……」；改成角色允许的缓冲：「下面我从……开始说明」。\n- 禁止突然「跳出角色」道歉；若说错，用角色口吻纠正或顺势往下接。\n- 禁止把「${trigger}」当成道具表演；它是**内在锚点**，动作尽量小、自然。`;

  return [
    `【${roleSectionTitles.state}】`,
    stateBody,
    "",
    `【${roleSectionTitles.actions}】`,
    actionsBody,
    "",
    `【${roleSectionTitles.taboos}】`,
    taboosBody,
  ].join("\n");
}
