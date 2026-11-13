#!/usr/bin/env python3
"""Generate 100+ progressive challenges per supported language.

Output: data/challenges/<lang>.json
"""

import json
import os
import random

random.seed(42)

LANGUAGES = ["python", "javascript", "typescript", "java", "c", "cpp", "go", "ruby", "php", "rust"]

# Category -> (difficulty, level range start, level range end)
CATEGORIES = [
    ("Syntax & Operators", "easy", 1, 10),
    ("Control Flow", "easy", 11, 20),
    ("Strings", "easy", 21, 30),
    ("Collections & Arrays", "easy", 31, 40),
    ("Dictionaries & Sets", "medium", 41, 50),
    ("Functions & Scope", "medium", 51, 60),
    ("Recursion", "medium", 61, 70),
    ("Searching & Sorting", "medium", 71, 80),
    ("Data Structures", "hard", 81, 90),
    ("Algorithms", "hard", 91, 105),
]

# Language-specific code templates for a "print a value" starter.
# Each language has a print statement template and a comment style.
LANG = {
    "python": {"print": 'print({val})', "comment": "#", "ext": "py"},
    "javascript": {"print": 'console.log({val});', "comment": "//", "ext": "js"},
    "typescript": {"print": 'console.log({val});', "comment": "//", "ext": "ts"},
    "java": {"print": 'System.out.println({val});', "comment": "//", "ext": "java"},
    "c": {"print": 'printf("%d\\n", {val});', "comment": "//", "ext": "c"},
    "cpp": {"print": 'std::cout << {val} << std::endl;', "comment": "//", "ext": "cpp"},
    "go": {"print": 'fmt.Println({val})', "comment": "//", "ext": "go"},
    "ruby": {"print": 'puts {val}', "comment": "#", "ext": "rb"},
    "php": {"print": 'echo {val} . "\\n";', "comment": "//", "ext": "php"},
    "rust": {"print": 'println!("{}", {val});', "comment": "//", "ext": "rs"},
}

def slugify(title):
    return title.lower().replace(" ", "-").replace(":", "").replace(",", "").replace("(", "").replace(")", "")[:40]

# ---- Challenge blueprints per category ----
# Each returns a dict with title, description, starterCode (lang-specific handled later), expectedOutput (str), tags, estimatedMinutes, hints (3)

def make_blueprint(category, level, lang):
    """Return (title, description, starter_template, expected_output, tags, est, hints_list)."""
    # We'll dispatch by category
    if category == "Syntax & Operators":
        return bp_syntax(level, lang)
    elif category == "Control Flow":
        return bp_control(level, lang)
    elif category == "Strings":
        return bp_strings(level, lang)
    elif category == "Collections & Arrays":
        return bp_collections(level, lang)
    elif category == "Dictionaries & Sets":
        return bp_dicts(level, lang)
    elif category == "Functions & Scope":
        return bp_functions(level, lang)
    elif category == "Recursion":
        return bp_recursion(level, lang)
    elif category == "Searching & Sorting":
        return bp_searchsort(level, lang)
    elif category == "Data Structures":
        return bp_datastructs(level, lang)
    else:
        return bp_algorithms(level, lang)

# Helper to wrap a value in print for a language
def P(lang, val):
    return LANG[lang]["print"].replace("{val}", val)

# ---- Blueprints ----

def bp_syntax(level, lang):
    n = level + 2
    a, b = n, n + 3
    title = f"Level {level}: Sum of Two Numbers"
    desc = f"Given the numbers {a} and {b}, print their sum."
    starter = f"{LANG[lang]['comment']} Print the sum of {a} and {b}\n{P(lang, '0')}"
    exp = str(a + b)
    tags = ["arithmetic", "basics"]
    est = 5
    hints = [
        "Add the two given numbers together.",
        "Use the + operator.",
        f"The result is {a} + {b}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_control(level, lang):
    # fizzbuzz-style: print numbers 1..n with Fizz/Buzz
    n = 5 + (level % 6)
    lines = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            lines.append("FizzBuzz")
        elif i % 3 == 0:
            lines.append("Fizz")
        elif i % 5 == 0:
            lines.append("Buzz")
        else:
            lines.append(str(i))
    title = f"Level {level}: FizzBuzz 1 to {n}"
    desc = f"For each number from 1 to {n}, print the number — except print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both."
    starter = f"{LANG[lang]['comment']} Print FizzBuzz for 1..{n}\n{P(lang, '\"1\"')}"
    exp = "\n".join(lines)
    tags = ["loops", "conditionals", "modulo"]
    est = 8
    hints = [
        "Loop from 1 to the target number.",
        "Check divisibility by 15 first, then 3, then 5.",
        "Print the number itself when none of the rules apply.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_strings(level, lang):
    word = ["hello", "racecar", "python", "code", "level"][level % 5]
    rev = word[::-1]
    title = f"Level {level}: Reverse a String"
    desc = f'Given the string "{word}", print it reversed.'
    starter = f'{LANG[lang]["comment"]} Print "{word}" reversed\n{P(lang, chr(34) + word + chr(34))}'
    exp = rev
    tags = ["strings", "reversal"]
    est = 8
    hints = [
        "Read the string from its last character to the first.",
        "Many languages support slicing or reversal helpers.",
        f"The answer is {rev}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_collections(level, lang):
    arr = [i * 2 for i in range(1, 6 + (level % 4))]
    s = sum(arr)
    title = f"Level {level}: Sum of Array"
    desc = f"Given the array {arr}, print the sum of all its elements."
    starter = f"{LANG[lang]['comment']} Sum the array\n{P(lang, '0')}"
    exp = str(s)
    tags = ["arrays", "sum"]
    est = 8
    hints = [
        "Iterate over every element.",
        "Accumulate into a running total.",
        f"The total is {s}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_dicts(level, lang):
    d = {"a": 1, "b": 2, "c": 3}
    # vary values
    vals = [level % 5 + 1, (level * 2) % 7 + 1, (level * 3) % 9 + 1]
    d = {"x": vals[0], "y": vals[1], "z": vals[2]}
    total = sum(vals)
    title = f"Level {level}: Sum Dictionary Values"
    desc = f"Given a dictionary with values {vals}, print the sum of all values."
    starter = f"{LANG[lang]['comment']} Sum all values\n{P(lang, '0')}"
    exp = str(total)
    tags = ["dictionaries", "sum"]
    est = 8
    hints = [
        "Iterate over the dictionary's values.",
        "Add each value to a running total.",
        f"The total is {total}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_functions(level, lang):
    def f(x):
        return x * x + 1
    x = level % 10 + 1
    res = f(x)
    title = f"Level {level}: Square Plus One"
    desc = f"Define a function that returns x*x + 1. Call it with {x} and print the result."
    starter = f"{LANG[lang]['comment']} Define and call the function\n{P(lang, '0')}"
    exp = str(res)
    tags = ["functions", "arithmetic"]
    est = 10
    hints = [
        "Create a function taking one parameter.",
        "Return x*x + 1.",
        f"Calling with {x} gives {res}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_recursion(level, lang):
    def fact(n):
        return 1 if n <= 1 else n * fact(n - 1)
    n = (level % 6) + 1
    res = fact(n)
    title = f"Level {level}: Factorial"
    desc = f"Compute the factorial of {n} recursively and print it."
    starter = f"{LANG[lang]['comment']} Recursive factorial of {n}\n{P(lang, '0')}"
    exp = str(res)
    tags = ["recursion", "factorial"]
    est = 12
    hints = [
        "Base case: factorial of 0 or 1 is 1.",
        "Recursive case: n * factorial(n-1).",
        f"{n}! = {res}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_searchsort(level, lang):
    arr = [random.randint(1, 50) for _ in range(6 + (level % 4))]
    sorted_arr = sorted(arr)
    title = f"Level {level}: Sort and Print"
    desc = f"Given the array {arr}, sort it ascending and print the elements space-separated."
    starter = f"{LANG[lang]['comment']} Sort the array\n{P(lang, '0')}"
    exp = " ".join(str(x) for x in sorted_arr)
    tags = ["sorting", "arrays"]
    est = 10
    hints = [
        "Use a built-in sort or implement one.",
        "Print elements separated by spaces.",
        f"Sorted: {exp}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_datastructs(level, lang):
    # stack: reverse a list using stack
    arr = [random.randint(1, 9) for _ in range(4 + (level % 4))]
    rev = arr[::-1]
    title = f"Level {level}: Reverse via Stack"
    desc = f"Use a stack to reverse the array {arr} and print the result space-separated."
    starter = f"{LANG[lang]['comment']} Reverse using a stack\n{P(lang, '0')}"
    exp = " ".join(str(x) for x in rev)
    tags = ["stack", "data-structures"]
    est = 15
    hints = [
        "Push all elements onto a stack.",
        "Pop them off to get reversed order.",
        f"Reversed: {exp}.",
    ]
    return title, desc, starter, exp, tags, est, hints

def bp_algorithms(level, lang):
    # fibonacci nth
    def fib(n):
        a, b = 0, 1
        for _ in range(n):
            a, b = b, a + b
        return a
    n = 5 + (level % 8)
    res = fib(n)
    title = f"Level {level}: Fibonacci Number"
    desc = f"Print the {n}-th Fibonacci number (0-indexed: F0=0, F1=1)."
    starter = f"{LANG[lang]['comment']} Compute Fibonacci({n})\n{P(lang, '0')}"
    exp = str(res)
    tags = ["algorithms", "fibonacci"]
    est = 15
    hints = [
        "Fibonacci: F(n) = F(n-1) + F(n-2).",
        "Base cases: F(0)=0, F(1)=1.",
        f"F({n}) = {res}.",
    ]
    return title, desc, starter, exp, tags, est, hints

BLUEPRINTS = {
    "Syntax & Operators": bp_syntax,
    "Control Flow": bp_control,
    "Strings": bp_strings,
    "Collections & Arrays": bp_collections,
    "Dictionaries & Sets": bp_dicts,
    "Functions & Scope": bp_functions,
    "Recursion": bp_recursion,
    "Searching & Sorting": bp_searchsort,
    "Data Structures": bp_datastructs,
    "Algorithms": bp_algorithms,
}

def build_challenges():
    out_dir = os.path.join("data", "challenges")
    os.makedirs(out_dir, exist_ok=True)

    for lang in LANGUAGES:
        challenges = []
        level = 1
        for cat, diff, lo, hi in CATEGORIES:
            bp = BLUEPRINTS[cat]
            for lvl in range(lo, hi + 1):
                title, desc, starter, exp, tags, est, hints = bp(lvl, lang)
                # Adjust title level number to lvl
                title = title.replace(f"Level {lvl}:", f"Level {lvl}:")  # keep
                # ensure level in title matches lvl
                title = f"Level {lvl}: " + title.split(": ", 1)[1]
                cid = f"{lang}-{str(lvl).zfill(3)}-{slugify(title.split(': ',1)[1])}"
                ch = {
                    "id": cid,
                    "title": title,
                    "difficulty": diff,
                    "language": lang,
                    "category": cat,
                    "tags": tags,
                    "estimatedMinutes": est,
                    "description": desc,
                    "starterCode": starter,
                    "expectedOutput": exp,
                    "hints": hints,
                }
                challenges.append(ch)
                level += 1

        # Pad to 105 if needed (already 105)
        path = os.path.join(out_dir, f"{lang}.json")
        with open(path, "w") as f:
            json.dump(challenges, f, indent=2)
        print(f"{lang}: {len(challenges)} challenges -> {path}")

if __name__ == "__main__":
    build_challenges()
    print("Done.")
