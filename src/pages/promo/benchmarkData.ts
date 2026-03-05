export const SYSTEM_SNAPSHOT_DATE = '2026-03-05';

export type SystemMetric = {
  label: { en: string; zh: string };
  value: { en: string; zh: string };
};

export type SystemReadiness = {
  label: { en: string; zh: string };
  score: number;
  detail: { en: string; zh: string };
};

export const SYSTEM_METRICS: SystemMetric[] = [
  {
    label: { en: 'Policy Gates', zh: '策略闸门' },
    value: { en: 'Guarded', zh: '有闸门' },
  },
  {
    label: { en: 'Install Targets', zh: '安装目标' },
    value: { en: 'Multi', zh: '多端' },
  },
  {
    label: { en: 'Simulation', zh: '模拟' },
    value: { en: 'Scenario', zh: '场景化' },
  },
];

export const SYSTEM_READINESS: SystemReadiness[] = [
  {
    label: { en: 'Trust Layer', zh: '信任层' },
    score: 92,
    detail: { en: 'Policy gates and audit trail', zh: '策略闸门 + 审计轨迹' },
  },
  {
    label: { en: 'Install Reliability', zh: '安装可靠性' },
    score: 88,
    detail: { en: 'Preview + recovery loops', zh: '预演 + 恢复路径' },
  },
  {
    label: { en: 'Simulation Surface', zh: '模拟覆盖' },
    score: 84,
    detail: { en: 'Scenario replay and export', zh: '场景回放与导出' },
  },
];

export const SYSTEM_PILLARS = [
  { en: 'Governed delivery', zh: '治理交付' },
  { en: 'Skill assets', zh: '技能资产' },
  { en: 'Multi-agent reach', zh: '多代理覆盖' },
  { en: 'Simulation loop', zh: '模拟闭环' },
];
