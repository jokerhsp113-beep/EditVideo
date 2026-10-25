import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..');
const reportDir=path.join(root,'professional-editor-upgrade/professional-editor/reports/visual-refresh-20261013');
fs.mkdirSync(reportDir,{recursive:true});
const commands=[['root-check','node_modules/eslint/bin/eslint.js',['src']],['root-types','node_modules/typescript/bin/tsc',['--project','tsconfig.json']],['engine-types','node_modules/typescript/bin/tsc',['--project','professional-editor-upgrade/professional-editor/tsconfig.json']],['engine-tests',null,['--test','professional-editor-upgrade/professional-editor/evaluations/core.test.mjs']]];
const results=commands.map(([id,script,args])=>{
  const run=spawnSync(process.execPath,script?[script,...args]:args,{cwd:root,encoding:'utf8'});
  fs.writeFileSync(path.join(reportDir,`${id}.log`),run.stdout+run.stderr);
  return {id,exitCode:run.status,error:run.error?.message??null};
});
fs.writeFileSync(path.join(reportDir,'checks.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
process.exitCode=results.some(r=>r.exitCode!==0)?1:0;
