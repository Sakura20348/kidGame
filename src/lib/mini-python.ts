// A tiny, safe Python interpreter for kids (a subset of real Python).
//
// Supports: function calls, print(), variables (=, +=, -=), numbers, strings,
// + - * / // %, comparisons, and/or/not, True/False/None,
// for … in range(…):, while …:, if/elif/else, pass, # comments.
// Errors are friendly and always point at a line number.

export type Value = number | string | boolean | null

export class PyError extends Error {
  line: number
  kind: string
  constructor(kind: string, line: number, message: string) {
    super(message)
    this.kind = kind
    this.line = line
  }
}

export type Builtin = (args: Value[], line: number) => Value | void

// ------------------------------------------------------------------ tokens

type Tok =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "name"; v: string }
  | { t: "op"; v: string }

const OPS = ["//", "==", "!=", "<=", ">=", "+=", "-=", "+", "-", "*", "/", "%", "(", ")", ",", ":", "<", ">", "="]

function tokenize(src: string, line: number): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === " " || c === "\t") {
      i++
      continue
    }
    if (c === "#") break
    if (/[0-9]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      out.push({ t: "num", v: Number(src.slice(i, j)) })
      i = j
      continue
    }
    if (c === '"' || c === "'" || c === "“" || c === "”") {
      const close = c === "“" ? "”" : c
      let j = i + 1
      let s = ""
      while (j < src.length && src[j] !== close && !(close === "”" && src[j] === '"')) {
        if (src[j] === "\\" && j + 1 < src.length) {
          const n = src[j + 1]
          s += n === "n" ? "\n" : n === "t" ? "\t" : n
          j += 2
        } else s += src[j++]
      }
      if (j >= src.length) throw new PyError("SyntaxError", line, `Line ${line}: this text is missing its closing ${close} quote.`)
      out.push({ t: "str", v: s })
      i = j + 1
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++
      out.push({ t: "name", v: src.slice(i, j) })
      i = j
      continue
    }
    const op = OPS.find((o) => src.startsWith(o, i))
    if (!op) throw new PyError("SyntaxError", line, `Line ${line}: I don’t understand the symbol “${c}”.`)
    out.push({ t: "op", v: op })
    i += op.length
  }
  return out
}

// ------------------------------------------------------------------ AST

type Expr =
  | { k: "lit"; v: Value }
  | { k: "name"; name: string }
  | { k: "call"; name: string; args: Expr[] }
  | { k: "bin"; op: string; a: Expr; b: Expr }
  | { k: "not"; e: Expr }
  | { k: "neg"; e: Expr }

type Stmt =
  | { k: "expr"; e: Expr; line: number; bareName?: string }
  | { k: "assign"; name: string; op: string; e: Expr; line: number }
  | { k: "for"; name: string; args: Expr[]; body: Stmt[]; line: number }
  | { k: "while"; cond: Expr; body: Stmt[]; line: number }
  | { k: "if"; branches: { cond: Expr | null; body: Stmt[] }[]; line: number }
  | { k: "pass"; line: number }

class ExprParser {
  private i = 0
  private toks: Tok[]
  private line: number
  constructor(toks: Tok[], line: number) {
    this.toks = toks
    this.line = line
  }

  done() {
    return this.i >= this.toks.length
  }
  private peek() {
    return this.toks[this.i]
  }
  private isOp(v: string) {
    const t = this.peek()
    return t?.t === "op" && t.v === v
  }
  private isName(v: string) {
    const t = this.peek()
    return t?.t === "name" && t.v === v
  }
  private fail(msg: string): never {
    throw new PyError("SyntaxError", this.line, `Line ${this.line}: ${msg}`)
  }

  parse(): Expr {
    return this.or()
  }
  private or(): Expr {
    let a = this.and()
    while (this.isName("or")) {
      this.i++
      a = { k: "bin", op: "or", a, b: this.and() }
    }
    return a
  }
  private and(): Expr {
    let a = this.not()
    while (this.isName("and")) {
      this.i++
      a = { k: "bin", op: "and", a, b: this.not() }
    }
    return a
  }
  private not(): Expr {
    if (this.isName("not")) {
      this.i++
      return { k: "not", e: this.not() }
    }
    return this.compare()
  }
  private compare(): Expr {
    let a = this.add()
    while (["==", "!=", "<", ">", "<=", ">="].some((o) => this.isOp(o))) {
      const op = (this.toks[this.i++] as { v: string }).v
      a = { k: "bin", op, a, b: this.add() }
    }
    if (this.isOp("=")) this.fail("to compare two things use == (two equals signs).")
    return a
  }
  private add(): Expr {
    let a = this.mul()
    while (this.isOp("+") || this.isOp("-")) {
      const op = (this.toks[this.i++] as { v: string }).v
      a = { k: "bin", op, a, b: this.mul() }
    }
    return a
  }
  private mul(): Expr {
    let a = this.unary()
    while (this.isOp("*") || this.isOp("/") || this.isOp("//") || this.isOp("%")) {
      const op = (this.toks[this.i++] as { v: string }).v
      a = { k: "bin", op, a, b: this.unary() }
    }
    return a
  }
  private unary(): Expr {
    if (this.isOp("-")) {
      this.i++
      return { k: "neg", e: this.unary() }
    }
    return this.primary()
  }
  private primary(): Expr {
    const t = this.peek()
    if (!t) this.fail("this line ends too early. Is something missing?")
    this.i++
    if (t.t === "num") return { k: "lit", v: t.v }
    if (t.t === "str") return { k: "lit", v: t.v }
    if (t.t === "op" && t.v === "(") {
      const e = this.parse()
      if (!this.isOp(")")) this.fail("a bracket ( is missing its closing ).")
      this.i++
      return e
    }
    if (t.t === "name") {
      if (t.v === "True") return { k: "lit", v: true }
      if (t.v === "False") return { k: "lit", v: false }
      if (t.v === "None") return { k: "lit", v: null }
      if (this.isOp("(")) {
        this.i++
        const args: Expr[] = []
        if (!this.isOp(")")) {
          args.push(this.parse())
          while (this.isOp(",")) {
            this.i++
            args.push(this.parse())
          }
        }
        if (!this.isOp(")")) this.fail(`${t.v}( is missing its closing bracket ).`)
        this.i++
        return { k: "call", name: t.v, args }
      }
      return { k: "name", name: t.v }
    }
    this.fail(`I didn’t expect “${t.v}” here.`)
  }
}

function parseExpr(src: string, line: number): Expr {
  const p = new ExprParser(tokenize(src, line), line)
  const e = p.parse()
  if (!p.done()) throw new PyError("SyntaxError", line, `Line ${line}: there is something extra at the end of this line.`)
  return e
}

// ------------------------------------------------------------------ statements

type SrcLine = { n: number; indent: number; text: string }

function stripComment(text: string) {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") quote = c
    else if (c === "#") return text.slice(0, i)
  }
  return text
}

function readLines(code: string): SrcLine[] {
  return code
    .replace(/\t/g, "    ")
    .split("\n")
    .map((raw, i) => {
      const text = stripComment(raw).trimEnd()
      return { n: i + 1, indent: text.length - text.trimStart().length, text: text.trim() }
    })
    .filter((l) => l.text)
}

const header = (text: string) => /^(for|while|if|elif|else)\b/.test(text)

export function parse(code: string): Stmt[] {
  const lines = readLines(code)
  let i = 0

  function block(indent: number): Stmt[] {
    const out: Stmt[] = []
    while (i < lines.length) {
      const l = lines[i]
      if (l.indent < indent) break
      if (l.indent > indent)
        throw new PyError("IndentationError", l.n, `Line ${l.n}: this line has extra spaces at the start. Only lines inside a loop or if need them.`)
      out.push(statement(l))
    }
    return out
  }

  function body(l: SrcLine): Stmt[] {
    i++
    const next = lines[i]
    if (!next || next.indent <= l.indent)
      throw new PyError(
        "IndentationError",
        next?.n ?? l.n,
        `Line ${next?.n ?? l.n + 1}: after the line ending with “:” the next lines must be indented (press Tab or add 4 spaces).`
      )
    return block(next.indent)
  }

  function needColon(l: SrcLine) {
    if (!l.text.endsWith(":"))
      throw new PyError("SyntaxError", l.n, `Line ${l.n}: this line must end with a colon  :`)
  }

  function statement(l: SrcLine): Stmt {
    const t = l.text
    if (t === "pass") {
      i++
      return { k: "pass", line: l.n }
    }
    if (/^for\b/.test(t)) {
      needColon(l)
      const m = t.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\s*\((.*)\)\s*:$/)
      if (!m) throw new PyError("SyntaxError", l.n, `Line ${l.n}: write a loop like this:  for i in range(3):`)
      const args = m[2].trim() ? splitArgs(m[2], l.n) : []
      if (args.length < 1 || args.length > 3)
        throw new PyError("SyntaxError", l.n, `Line ${l.n}: range() needs a number, like range(3).`)
      return { k: "for", name: m[1], args, body: body(l), line: l.n }
    }
    if (/^while\b/.test(t)) {
      needColon(l)
      return { k: "while", cond: parseExpr(t.slice(5, -1), l.n), body: body(l), line: l.n }
    }
    if (/^if\b/.test(t)) {
      needColon(l)
      const branches: { cond: Expr | null; body: Stmt[] }[] = [{ cond: parseExpr(t.slice(2, -1), l.n), body: body(l) }]
      while (i < lines.length && lines[i].indent === l.indent && /^(elif|else)\b/.test(lines[i].text)) {
        const b = lines[i]
        needColon(b)
        if (b.text.startsWith("elif")) branches.push({ cond: parseExpr(b.text.slice(4, -1), b.n), body: body(b) })
        else {
          if (b.text.replace(/\s/g, "") !== "else:")
            throw new PyError("SyntaxError", b.n, `Line ${b.n}: write else on its own, like  else:`)
          branches.push({ cond: null, body: body(b) })
          break
        }
      }
      return { k: "if", branches, line: l.n }
    }
    if (/^(elif|else)\b/.test(t))
      throw new PyError("SyntaxError", l.n, `Line ${l.n}: “${t.split(/\W/)[0]}” must come right after an if block.`)
    if (header(t)) throw new PyError("SyntaxError", l.n, `Line ${l.n}: I don’t understand this line.`)
    if (t.endsWith(":")) throw new PyError("SyntaxError", l.n, `Line ${l.n}: only for, while and if lines end with a colon.`)

    i++
    const assign = t.match(/^([A-Za-z_]\w*)\s*(\+=|-=|=)(?!=)\s*(.*)$/)
    if (assign) {
      if (!assign[3]) throw new PyError("SyntaxError", l.n, `Line ${l.n}: put a value after the = sign.`)
      return { k: "assign", name: assign[1], op: assign[2], e: parseExpr(assign[3], l.n), line: l.n }
    }
    const e = parseExpr(t, l.n)
    return { k: "expr", e, line: l.n, bareName: e.k === "name" ? e.name : undefined }
  }

  return block(0)
}

function splitArgs(src: string, line: number): Expr[] {
  const parts: string[] = []
  let depth = 0
  let cur = ""
  for (const c of src) {
    if (c === "(") depth++
    if (c === ")") depth--
    if (c === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += c
  }
  parts.push(cur)
  return parts.map((p) => parseExpr(p, line))
}

// ------------------------------------------------------------------ run

export function pyStr(v: Value): string {
  if (v === true) return "True"
  if (v === false) return "False"
  if (v === null) return "None"
  if (typeof v === "number") return Number.isInteger(v) && !Object.is(v, -0) ? String(v) : String(v)
  return v
}

const typeName = (v: Value) =>
  typeof v === "number" ? "number" : typeof v === "string" ? "text" : typeof v === "boolean" ? "True/False" : "None"

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

type RunOptions = {
  builtins: Record<string, Builtin>
  /** Stop runaway loops */
  maxSteps?: number
}

export function run(code: string, { builtins, maxSteps = 5000 }: RunOptions) {
  const program = parse(code)
  const vars = new Map<string, Value>()
  let steps = 0

  const standard: Record<string, Builtin> = {
    str: ([v]) => pyStr(v ?? ""),
    int: ([v], line) => {
      const n = typeof v === "string" ? Number(v.trim()) : Number(v)
      if (Number.isNaN(n)) throw new PyError("ValueError", line, `Line ${line}: int() can’t turn “${pyStr(v)}” into a number.`)
      return Math.trunc(n)
    },
    len: ([v], line) => {
      if (typeof v !== "string") throw new PyError("TypeError", line, `Line ${line}: len() needs text, like len("hello").`)
      return v.length
    },
    abs: ([v]) => Math.abs(Number(v)),
    min: (args) => Math.min(...args.map(Number)),
    max: (args) => Math.max(...args.map(Number)),
  }
  const fns: Record<string, Builtin> = { ...standard, ...builtins }

  function unknown(name: string, line: number): never {
    const known = [...Object.keys(fns), ...vars.keys(), "print", "range", "for", "while", "if", "True", "False"]
    const best = known.map((k) => ({ k, d: distance(name.toLowerCase(), k.toLowerCase()) })).sort((a, b) => a.d - b.d)[0]
    const hint = best && best.d <= 2 ? ` Did you mean ${fns[best.k] ? `${best.k}()` : best.k}?` : ""
    throw new PyError("NameError", line, `Line ${line}: I don’t know “${name}”.${hint}`)
  }

  function num(v: Value, op: string, line: number) {
    if (typeof v === "number") return v
    if (typeof v === "boolean") return v ? 1 : 0
    throw new PyError("TypeError", line, `Line ${line}: you can’t use ${op} with ${typeName(v)}.`)
  }

  function evaluate(e: Expr, line: number): Value {
    switch (e.k) {
      case "lit":
        return e.v
      case "name":
        if (vars.has(e.name)) return vars.get(e.name)!
        if (fns[e.name]) throw new PyError("TypeError", line, `Line ${line}: to use ${e.name}, add brackets: ${e.name}()`)
        return unknown(e.name, line)
      case "not":
        return !truthy(evaluate(e.e, line))
      case "neg":
        return -num(evaluate(e.e, line), "-", line)
      case "call": {
        if (e.name === "range") throw new PyError("SyntaxError", line, `Line ${line}: use range() in a for loop, like  for i in range(3):`)
        const args = e.args.map((a) => evaluate(a, line))
        const fn = fns[e.name]
        if (!fn) return unknown(e.name, line)
        const r = fn(args, line)
        return r === undefined ? null : r
      }
      case "bin": {
        if (e.op === "and") {
          const a = evaluate(e.a, line)
          return truthy(a) ? evaluate(e.b, line) : a
        }
        if (e.op === "or") {
          const a = evaluate(e.a, line)
          return truthy(a) ? a : evaluate(e.b, line)
        }
        const a = evaluate(e.a, line)
        const b = evaluate(e.b, line)
        switch (e.op) {
          case "+":
            if (typeof a === "string" && typeof b === "string") return a + b
            if (typeof a === "string" || typeof b === "string")
              throw new PyError("TypeError", line, `Line ${line}: you can only join text with text. Try str(number) to turn a number into text.`)
            return num(a, "+", line) + num(b, "+", line)
          case "-":
            return num(a, "-", line) - num(b, "-", line)
          case "*":
            if (typeof a === "string" && typeof b === "number") return a.repeat(Math.max(0, b))
            if (typeof b === "string" && typeof a === "number") return b.repeat(Math.max(0, a))
            return num(a, "*", line) * num(b, "*", line)
          case "/":
          case "//":
          case "%": {
            const x = num(a, e.op, line)
            const y = num(b, e.op, line)
            if (y === 0) throw new PyError("ZeroDivisionError", line, `Line ${line}: you can’t divide by zero!`)
            return e.op === "/" ? x / y : e.op === "//" ? Math.floor(x / y) : ((x % y) + y) % y
          }
          case "==":
            return a === b
          case "!=":
            return a !== b
          case "<":
            return (a as number) < (b as number)
          case ">":
            return (a as number) > (b as number)
          case "<=":
            return (a as number) <= (b as number)
          case ">=":
            return (a as number) >= (b as number)
        }
      }
    }
    throw new PyError("SyntaxError", line, `Line ${line}: I don’t understand this.`)
  }

  function truthy(v: Value) {
    return !(v === false || v === null || v === 0 || v === "")
  }

  function tick(line: number) {
    if (++steps > maxSteps)
      throw new PyError("TimeoutError", line, `Line ${line}: your code ran for too long. Is there a loop that never stops?`)
  }

  function exec(stmts: Stmt[]) {
    for (const s of stmts) {
      tick(s.line)
      switch (s.k) {
        case "pass":
          break
        case "expr":
          if (s.bareName && fns[s.bareName])
            throw new PyError("SyntaxError", s.line, `Line ${s.line}: to run ${s.bareName}, add brackets:  ${s.bareName}()`)
          evaluate(s.e, s.line)
          break
        case "assign": {
          const v = evaluate(s.e, s.line)
          if (s.op === "=") vars.set(s.name, v)
          else {
            if (!vars.has(s.name)) unknown(s.name, s.line)
            const old = vars.get(s.name)!
            vars.set(
              s.name,
              s.op === "+="
                ? typeof old === "string" && typeof v === "string"
                  ? old + v
                  : num(old, "+=", s.line) + num(v, "+=", s.line)
                : num(old, "-=", s.line) - num(v, "-=", s.line)
            )
          }
          break
        }
        case "for": {
          const nums = s.args.map((a) => evaluate(a, s.line))
          if (nums.some((n) => typeof n !== "number" || !Number.isInteger(n)))
            throw new PyError("TypeError", s.line, `Line ${s.line}: range() needs whole numbers, like range(3).`)
          const [start, stop, step] =
            nums.length === 1 ? [0, nums[0] as number, 1] : [nums[0] as number, nums[1] as number, (nums[2] as number) ?? 1]
          if (step === 0) throw new PyError("ValueError", s.line, `Line ${s.line}: range() step can’t be 0.`)
          for (let v = start; step > 0 ? v < stop : v > stop; v += step) {
            vars.set(s.name, v)
            exec(s.body)
          }
          break
        }
        case "while":
          while (truthy(evaluate(s.cond, s.line))) {
            tick(s.line)
            exec(s.body)
          }
          break
        case "if":
          for (const b of s.branches) {
            if (b.cond === null || truthy(evaluate(b.cond, s.line))) {
              exec(b.body)
              break
            }
          }
          break
      }
    }
  }

  exec(program)
  return { vars }
}

/** Number of real code lines (not blank, not comments) – used for 3-star goals. */
export function codeLines(code: string) {
  return readLines(code).length
}
