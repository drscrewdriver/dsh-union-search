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


/**
 * client 半（0.17.0-rc.8 起纳入构建）：src/client/index.ts → lib/client.js。
 * banner/footer 复刻宿主 ModuleLoader CJS 工厂协议；react 与 jsx-runtime 是平台共享模块，
 * 打进 bundle 会得到第二份 React 实例（hooks 全废），必须 external。
 * boot 图条目 id 必须等于 package.json name（drscrewdriver 侧 graphRow(packageName) 校验）。
 */
const client: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: ['cjs'],
  platform: 'browser',
  target: 'es2020',
  dts: false,
  minify: false,
  clean: false,
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: [
      '// 宿主 boot 图条目 id = 包内 manifest name（dsh-client-modules: graphRow(packageName)），',
      '// 浏览器侧随后还会校验自注册 id 与之逐字相等（client/system.ts: "loaded without registering"）。',
      '// 所以这里的 id 必须等于 package.json 的 "name"，不能写 profile 键/别名——',
      '// 0.10.15 起包名统一为裸名 dsh-union-search（scoped 时代 0.9.27~0.10.14 结束）。',
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    ].join(String.fromCharCode(10)),
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}


// rc.9：CLI 脚本源码在 src/cli/，构建逐名输出回原路径（bin/restore.js 随包发布、tools/server.mjs 仓内工具）。
const cliRestore: UserConfig = {
  name: `${ID}/restore`,
  entry: { restore: 'src/cli/restore.ts' },
  outDir: 'bin',
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  dts: false,
  minify: false,
  clean: false,
  outputOptions: { entryFileNames: 'restore.js' },
}

const cliServer: UserConfig = {
  name: `${ID}/server`,
  entry: { server: 'src/cli/server.ts' },
  outDir: 'tools',
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  dts: false,
  minify: false,
  clean: false,
  outputOptions: { entryFileNames: 'server.mjs' },
}
export default defineConfig([host, mcpAdapter, client, cliRestore, cliServer])
