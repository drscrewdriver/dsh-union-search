/**
 * dsh-union-search — 构建配置（tsdown，与 mine-dsh-plugins 兄弟仓同构）。
 *
 * 宿主半产出**必须**保持三文件契约：`lib/index.js`、`lib/client.js`、
 * `lib/mcp_adapter.js` —— package.json 的 `files` 逐名罗列这三个文件，
 * release workflow 不跑 build（tag 即发、lib 直接入库），任何产物拆分/改名都会漏发。
 * 因此 host 半用 tsdown 单文件 bundle（而非 tsc 镜像 emit），src 的按域拆分
 * 只存在于源码层，产物仍是两个 ESM 文件。
 *
 * `./mcp_adapter.js` 在 index bundle 里显式 external：两个入口各自独立成 pack，
 * 避免 rolldown code-splitting 改写相对导入 specifier。
 *
 * client 半（ModuleLoader banner/footer）在 0.17.0-rc.8 反抽取完成后追加，
 * 见 .agents/plans/union-search-ts-rewrite/spec.md §C。
 */
import { defineConfig, type UserConfig } from 'tsdown'

const ID = 'dsh-union-search'

/** 宿主运行时提供的模块：dependencies/peerDependencies 由 tsdown 自动 external，这里只补相对入口。 */
const HOST_EXTERNALS = ['./mcp_adapter.js']

const host: UserConfig = {
  name: ID,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  minify: false,
  clean: false, // 绝不能清 lib：client.js 尚未纳入构建，且历史产物要逐文件覆盖
  external: HOST_EXTERNALS,
  outputOptions: { entryFileNames: 'index.js' },
}

const mcpAdapter: UserConfig = {
  name: `${ID}/mcp_adapter`,
  entry: { mcp_adapter: 'src/mcp_adapter.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  minify: false,
  clean: false,
  outputOptions: { entryFileNames: 'mcp_adapter.js' },
}

export default defineConfig([host, mcpAdapter])
