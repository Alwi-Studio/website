// Rules written the way the staff team writes them in the admin editor:
//
//   **2.1.2.1 X-Ray & FreeCam - Cheating/Unfair Advantage**
//   Menggunakan Texture/Resource Pack ...
//   **Sanksi:** Ban 3 hari → Ban 7 hari → Ban permanen Akun Utama.
//
// The number is authored, never computed: staff cite these numbers in punishments.
const RULE_HEAD = /^\*\*(\d+(?:\.\d+)+)\s+(.+?)\*\*$/
const LABELLED = /^\*\*([^*]+?):\*\*\s*(.*)$/

export function hasRuleText(text) {
  return String(text ?? '').split('\n').some((line) => RULE_HEAD.test(line.trim()))
}

// Returns text and rule blocks in order. Lines before the first rule stay plain text.
export function parseRuleText(text) {
  const blocks = []
  let rule = null

  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const head = RULE_HEAD.exec(line)
    if (head) {
      const named = /^(.+?)\s+-\s+(.+)$/.exec(head[2])
      rule = { type: 'rule', number: head[1], title: named ? named[1] : head[2], tag: named?.[2] ?? '', body: [], notes: [] }
      blocks.push(rule)
      continue
    }

    const labelled = rule && LABELLED.exec(line)
    if (labelled) {
      // "A → B → C" is the escalation per repeat offence. Authors leave gaps ("→ →") and drop spaces ("hari→").
      const steps = labelled[2].split('→').map((step) => step.trim().replace(/\.$/, '')).filter(Boolean)
      rule.notes.push({ label: labelled[1], steps })
    } else if (rule) {
      rule.body.push(line)
    } else {
      blocks.push({ type: 'text', text: line })
    }
  }

  return blocks
}
