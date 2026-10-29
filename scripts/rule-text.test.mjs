// Unit tier: authored rules split into number, title, body and penalty ladder without renumbering.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasRuleText, parseRuleText } from '../src/common/ruleText.js'

test('a rule keeps its authored number, splits a " - " tag and collects its body lines', () => {
  const [rule] = parseRuleText('**2.1.2.1 X-Ray & FreeCam - Cheating/Unfair Advantage**\nFirst line.\nSecond line.')
  assert.deepEqual(rule, {
    type: 'rule', number: '2.1.2.1', title: 'X-Ray & FreeCam', tag: 'Cheating/Unfair Advantage',
    body: ['First line.', 'Second line.'], notes: [],
  })
})

test('a hyphen without spaces stays in the title', () => {
  assert.equal(parseRuleText('**2.1.2.2 Auto-Clicker**')[0].title, 'Auto-Clicker')
  assert.equal(parseRuleText('**2.1.2.2 Auto-Clicker**')[0].tag, '')
})

test('the penalty ladder drops empty steps, tolerates missing spaces and strips the closing full stop', () => {
  const text = '**1.1.1 Rule**\nBody.\n**Sanksi:** Peringatan + adsMute → Mute 10 menit → → Jail 3 Jam\n**Toleransi:**  Ban 3 hari→ Ban 7 hari.'
  assert.deepEqual(parseRuleText(text)[0].notes, [
    { label: 'Sanksi', steps: ['Peringatan + adsMute', 'Mute 10 menit', 'Jail 3 Jam'] },
    { label: 'Toleransi', steps: ['Ban 3 hari', 'Ban 7 hari'] },
  ])
})

test('lines before the first rule stay text, and a labelled line there is not a penalty', () => {
  const blocks = parseRuleText('Intro.\n**Yurisdiksi:** Semua pemain.\n**3.5.2 Privasi**\nNo penalty line.')
  assert.deepEqual(blocks.map((block) => block.type), ['text', 'text', 'rule'])
  assert.deepEqual(blocks[2].notes, [])
})

test('only a numbered bold line with a dot is a rule header', () => {
  assert.equal(hasRuleText('**Sanksi:** Ban permanen.'), false)
  assert.equal(hasRuleText('**2026 Update**'), false)
  assert.equal(hasRuleText('Plain\n  **4.3.2 Zero Tolerance**  '), true)
  assert.equal(hasRuleText(undefined), false)
})
