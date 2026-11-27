import fs from "node:fs";
import path from "node:path";

// src/cli/restore.ts
const PINNED_SEARCH_ID = "ddg";
function processPatchText(text, { includeFetch = false } = {}) {
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	const lines = text.split(/\r?\n/);
	const out = [];
	const removed = [];
	let entryIndent = -1;
	let inConfig = false;
	let configIndent = -1;
	for (const line of lines) {
		const indent = line.match(/^\s*/)[0].length;
		const isBlank = !line.trim();
		if (entryIndent !== -1 && !isBlank && indent <= entryIndent) {
			entryIndent = -1;
			inConfig = false;
		}
		if (entryIndent === -1 && /^\s*-\s+id:\s*web\s*$/.test(line)) {
			entryIndent = indent;
			out.push(line);
			continue;
		}
		if (entryIndent !== -1) {
			if (!inConfig && /^\s*config:\s*$/.test(line)) {
				inConfig = true;
				configIndent = indent;
				out.push(line);
				continue;
			}
			if (inConfig && indent > configIndent) {
				if (new RegExp(`^\\s*searchProvider:\\s*['"]?${PINNED_SEARCH_ID}['"]?\\s*(#.*)?$`).test(line)) {
					removed.push(`searchProvider: ${PINNED_SEARCH_ID}`);
					continue;
				}
				if (/^\s*fetchProvider:\s*['"]union-search['"]?\s*(#.*)?$/.test(line) || /^\s*fetchProvider:\s*union-search\s*(#.*)?$/.test(line)) {
					removed.push("fetchProvider: union-search");
					continue;
				}
				if (includeFetch && /^\s*fetchProvider:/.test(line)) {
					removed.push(line.trim());
					continue;
				}
			} else if (inConfig && indent <= configIndent && !isBlank) inConfig = false;
		}
		out.push(line);
	}
	return {
		text: out.join(eol),
		removed,
		inWebEntry: entryIndent !== -1
	};
}
function findPatchFiles(profilesDir) {
	const hits = [];
	let names = [];
	try {
		names = fs.readdirSync(profilesDir);
	} catch {
		return hits;
	}
	for (const name of names) for (const fname of ["cordis.patch.yml", "cordis.patch.yaml"]) {
		const p = path.join(profilesDir, name, fname);
		if (fs.existsSync(p)) hits.push(p);
	}
	return hits;
}
function main(argv) {
	const apply = argv.includes("--apply");
	const includeFetch = argv.includes("--include-fetch");
	const di = argv.indexOf("--profiles-dir");
	const profilesDir = di !== -1 && argv[di + 1] ? argv[di + 1] : path.join(process.cwd(), "profiles");
	const files = findPatchFiles(profilesDir);
	if (files.length === 0) {
		console.log(`未发现任何 cordis.patch.yml（目录：${profilesDir}）——无需清理。`);
		return;
	}
	let total = 0;
	for (const file of files) {
		const { text, removed } = processPatchText(fs.readFileSync(file, "utf8"), { includeFetch });
		if (removed.length === 0) {
			console.log(`- ${file}: 干净`);
			continue;
		}
		total += removed.length;
		console.log(`- ${file}:`);
		for (const r of removed) console.log(`    将删除  ${r}`);
		if (apply) fs.writeFileSync(file, text);
	}
	console.log(total === 0 ? "没有发现本插件钉选造成的悬空字段。" : apply ? `已清理 ${total} 行（重启 dsh 生效）。` : `dry-run：共 ${total} 行待删；加 --apply 落盘。`);
}
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) main(process.argv.slice(2));

export { findPatchFiles, processPatchText };