export const BENCHMARK_SNAPSHOT_DATE = '2026-03-04';

export type BenchmarkRepo = {
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  updatedAt: string;
};

export const BENCHMARK_REPOS: BenchmarkRepo[] = [
  {
    name: 'alirezarezvani/claude-skills',
    url: 'https://github.com/alirezarezvani/claude-skills',
    description: 'Large community skill collection with commands and subagents.',
    stars: 2341,
    forks: 307,
    updatedAt: '2026-03-04T12:30:23Z',
  },
  {
    name: 'daymade/claude-code-skills',
    url: 'https://github.com/daymade/claude-code-skills',
    description: 'Marketplace-oriented repository focused on production-ready skills.',
    stars: 621,
    forks: 89,
    updatedAt: '2026-03-04T11:48:11Z',
  },
  {
    name: 'levnikolaevich/claude-code-skills',
    url: 'https://github.com/levnikolaevich/claude-code-skills',
    description: 'Workflow-complete skill collection emphasizing delivery stages.',
    stars: 144,
    forks: 26,
    updatedAt: '2026-03-04T12:18:08Z',
  },
  {
    name: 'netresearch/claude-code-marketplace',
    url: 'https://github.com/netresearch/claude-code-marketplace',
    description: 'Curated marketplace repository with multi-agent positioning.',
    stars: 19,
    forks: 1,
    updatedAt: '2026-03-02T10:09:40Z',
  },
];
