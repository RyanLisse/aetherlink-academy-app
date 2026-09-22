/** Verbatim source block from aetherlab monolith (id=src-eve-glossary). */
export default "import { defineState } from \"eve/context\";\nexport interface Glossary {\n  readonly terms: Readonly<Record<string, string>>;\n}\nexport const glossary = defineState<Glossary>(\"analytics.glossary\", () => ({\n  terms: {},\n}));\n" as string;
