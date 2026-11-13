// Pre-written hints used when Groq is unreachable (rate limited, network down,
// missing GROQ_API_KEY, ...). Keyed by challenge slug, matching the keys of
// data/fallback.json and data/challenges.json. Selection logic lives in
// pages/api/hint.js — this file is data only.
export const DEFAULT_FALLBACK_HINT =
  "Take a slow look at the expected output and test your logic with tiny inputs first. Check your loop bounds and what your code actually prints — small console.log checkpoints usually reveal the gap.";

const fallbackHints = {
  "reverse-string":
    "Think of strings as sequences of characters: there is a built-in way to split a string into an array of single characters, an array method that flips the order, and one that glues an array back into a string. Chain those three ideas together.",
  fizzbuzz:
    "Walk the loop from 1 to 5 and decide what to print for each i. The order of your checks matters: a number divisible by both 3 and 5 must be caught before the single-multiple checks, or it will never reach the FizzBuzz branch.",
  "palindrome-check":
    "A word is a palindrome when it equals its own reverse. Lowercase the word first so case doesn't matter, build the reversed version of it, and compare the two with === — then print the result.",
  "count-vowels":
    "Loop over each character of the word (lowercase it first so A and a both count) and keep a tally that goes up by one whenever the character is one of a, e, i, o, u. A string like \"aeiou\" is handy to check against.",
  "sum-even-numbers":
    "Go through the array once, keeping a running total. A number is even when number % 2 === 0 — add only those to the total, then print the total after the loop.",
  "two-sum":
    "For every pair of positions in the array, ask whether the two numbers add up to the target. Two nested loops over the indices do the job; remember the inner loop can start at the outer index + 1 so you never pair a number with itself.",
  factorial:
    "Start a total at 1 and multiply it by every number from 1 up to n in a loop. That also makes factorial(0) come out as 1 automatically, which is exactly what the math expects.",
};

export default fallbackHints;
