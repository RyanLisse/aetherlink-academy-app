/** Lesson source registry (was <script type="text/plain" id="src-*">). */
import council_instructions from "./council-instructions";
import council_schema from "./council-schema";
import eve_cost from "./eve-cost";
import eve_define_metric from "./eve-define-metric";
import eve_glossary from "./eve-glossary";
import eve_instructions from "./eve-instructions";
import eve_recall from "./eve-recall";
import eve_run_sql_before from "./eve-run-sql-before";
import eve_skill from "./eve-skill";
import eve_tool from "./eve-tool";
import hook from "./hook";
import qs_agent from "./qs-agent";
import qs_utils from "./qs-utils";
import research_agents from "./research-agents";
import research_agents_py from "./research-agents-py";
import research_lead from "./research-lead";
import sdk_bridge from "./sdk-bridge";
import sdk_council from "./sdk-council";
import sdk_fixture from "./sdk-fixture";
import sdk_test from "./sdk-test";
import sdk_weather from "./sdk-weather";

export const SRC: Record<string, string> = {
  "council-instructions": council_instructions,
  "council-schema": council_schema,
  "eve-cost": eve_cost,
  "eve-define-metric": eve_define_metric,
  "eve-glossary": eve_glossary,
  "eve-instructions": eve_instructions,
  "eve-recall": eve_recall,
  "eve-run-sql-before": eve_run_sql_before,
  "eve-skill": eve_skill,
  "eve-tool": eve_tool,
  "hook": hook,
  "qs-agent": qs_agent,
  "qs-utils": qs_utils,
  "research-agents": research_agents,
  "research-agents-py": research_agents_py,
  "research-lead": research_lead,
  "sdk-bridge": sdk_bridge,
  "sdk-council": sdk_council,
  "sdk-fixture": sdk_fixture,
  "sdk-test": sdk_test,
  "sdk-weather": sdk_weather,
};

export const src = (id: string): string => {
  const v = SRC[id];
  if (v === undefined) throw new Error("unknown lesson source: " + id);
  return v;
};
