import React from 'react';
import { ExternalLink, GitFork, Sparkles, Star } from 'lucide-react';
import { BENCHMARK_REPOS, BENCHMARK_SNAPSHOT_DATE } from './benchmarkData';

const capabilityMatrix = [
  {
    axis: 'Collection Coverage',
    similar: '多数同类仓库强于“数量”，偏向清单型聚合。',
    forge: 'Forge 强于“结构化编辑 + 运行验证 + 多生态安装”。',
  },
  {
    axis: 'Trust & Compliance',
    similar: '通常缺少统一风险评分与动作级策略门禁。',
    forge: '内置 security scan 与 policy gate，导入/安装可控。',
  },
  {
    axis: 'Team Workflow',
    similar: '以个人收藏和复制粘贴为主。',
    forge: '支持本地目录同步、MCP 扩展、审计事件追踪。',
  },
  {
    axis: 'Distribution',
    similar: '目标生态通常单一。',
    forge: '同一 skill 支持多目标目录分发，便于规模扩展。',
  },
];

function formatIsoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 10);
}

export const PromoBenchmarks: React.FC = () => {
  return (
    <div className="space-y-8 ui-page-enter">
      <section className="promo-panel p-6 sm:p-10">
        <p className="ui-kicker text-brand">Benchmark Snapshot</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">同类仓库对标：从“集合”走向“产品化系统”</h1>
        <p className="mt-3 text-sm leading-7 text-text-muted sm:text-base">
          对标数据快照日期：{BENCHMARK_SNAPSHOT_DATE}（GitHub 公共仓库 metadata）。该页面用于对外说明差异化价值，
          不是为了比拼仓库星数，而是强调能力闭环与可增长性。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {BENCHMARK_REPOS.map((repo) => (
          <article key={repo.name} className="promo-panel p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold leading-6 text-text-main">{repo.name}</p>
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand hover:opacity-80"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-sm leading-6 text-text-muted">{repo.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="ui-badge ui-badge-brand">
                <Star className="h-3.5 w-3.5" />
                {repo.stars}
              </span>
              <span className="ui-badge ui-badge-info">
                <GitFork className="h-3.5 w-3.5" />
                {repo.forks}
              </span>
              <span className="ui-badge ui-badge-info">Updated {formatIsoDate(repo.updatedAt)}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="promo-panel p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          <h2 className="text-2xl font-black tracking-tight">Forge 差异化矩阵</h2>
        </div>
        <div className="space-y-3">
          {capabilityMatrix.map((item) => (
            <div key={item.axis} className="grid gap-2 rounded-[var(--radius-base)] border border-border-main bg-bg-action/45 p-4 md:grid-cols-3">
              <p className="text-sm font-semibold text-brand">{item.axis}</p>
              <p className="text-xs leading-6 text-text-muted">同类项目：{item.similar}</p>
              <p className="text-xs leading-6 text-text-main">Agent Skill Forge：{item.forge}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
