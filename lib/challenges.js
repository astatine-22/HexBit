/**
 * CodeMentor challenge bank.
 *
 * Every screen reads challenges through `getChallenges()` and
 * `getChallengeById(id)`. Both are async on purpose so the local array can be
 * swapped for Supabase queries later without touching a single component.
 *
 * TODO: replace the MOCK_CHALLENGES array with Supabase queries. The public
 * function signatures below should stay the same.
 */

const MOCK_CHALLENGES = [
  {
    id: "python-reverse-string",
    title: "Reverse a String",
    difficulty: "easy",
    language: "python",
    category: "Strings",
    tags: ["strings", "slicing", "basics"],
    estimatedMinutes: 10,
    description:
      'Take the word "hello" and print it backwards. The output should be one line and nothing else.',
    expectedOutput: "olleh",
    starterCode: `word = "hello"

# Print word in reverse
print(word)
`,
    hints: [
      "Which character of the word should come out first?",
      "Think about reading the string from its last index down to index zero.",
      "Python strings support a step value — or build a new string while walking backwards — then print the result.",
    ],
  },
  {
    id: "javascript-even-numbers",
    title: "Even Numbers",
    difficulty: "easy",
    language: "javascript",
    category: "Loops",
    tags: ["loops", "modulo", "arrays"],
    estimatedMinutes: 12,
    description:
      "Print every even number from 2 through 10 on a single line, separated by spaces.",
    expectedOutput: "2 4 6 8 10",
    starterCode: `for (let number = 2; number <= 10; number += 1) {
  // Print only the even numbers, space-separated on one line
  console.log(number);
}
`,
    hints: [
      "How can you tell whether a whole number is even?",
      "Collect the values first and decide how to join them into one line.",
      "Use the remainder operator to test each number, keep the even ones in an array, then join with spaces.",
    ],
  },
  {
    id: "java-sum-digits",
    title: "Sum the Digits",
    difficulty: "easy",
    language: "java",
    category: "Math",
    tags: ["math", "loops", "digits"],
    estimatedMinutes: 15,
    description: "Add every digit in the number 12345 and print the total.",
    expectedOutput: "15",
    starterCode: `public class Main {
  public static void main(String[] args) {
    int number = 12345;
    int total = 0;

    // Add the digits of number
    System.out.println(total);
  }
}
`,
    hints: [
      "What is the last digit of 12345, and how could you isolate it?",
      "There is a number trick for removing the last digit after you use it.",
      "Repeatedly take the remainder after dividing by 10, add it to the total, then divide the number by 10.",
    ],
  },
  {
    id: "c-exact-greeting",
    title: "Exact Greeting",
    difficulty: "easy",
    language: "c",
    category: "Output",
    tags: ["output", "strings", "precision"],
    estimatedMinutes: 8,
    description:
      'Print exactly "Hello, CodeMentor!" — the checker compares every character, including the comma and exclamation mark.',
    expectedOutput: "Hello, CodeMentor!",
    starterCode: `#include <stdio.h>

int main(void) {
  // Print exactly: Hello, CodeMentor!
  printf("Hello\\n");
  return 0;
}
`,
    hints: [
      "Look at the required line character by character. What is different in the starter?",
      "Your current string is missing text and an important punctuation mark.",
      "Replace the printf text with the exact greeting, followed by the newline escape sequence.",
    ],
  },
  {
    id: "cpp-fibonacci-row",
    title: "Fibonacci Row",
    difficulty: "medium",
    language: "cpp",
    category: "Sequences",
    tags: ["sequences", "loops", "state"],
    estimatedMinutes: 20,
    description:
      "Print the first eight Fibonacci numbers on one line, separated by spaces, starting with 0 and 1.",
    expectedOutput: "0 1 1 2 3 5 8 13",
    starterCode: `#include <iostream>

int main() {
  // Print the first 8 Fibonacci numbers separated by spaces
  std::cout << 0 << std::endl;
  return 0;
}
`,
    hints: [
      "The sequence begins with 0 and 1. How is each next value produced?",
      "Keep track of the two most recent values as you build the row.",
      "Loop eight times, print the current value, then advance the pair so the next value is their sum.",
    ],
  },
  {
    id: "go-palindrome-check",
    title: "Palindrome Check",
    difficulty: "medium",
    language: "go",
    category: "Strings",
    tags: ["strings", "runes", "comparison"],
    estimatedMinutes: 18,
    description:
      'A palindrome reads the same forwards and backwards. For the word "racecar", print "Palindrome" if it is one, otherwise print "Not a palindrome".',
    expectedOutput: "Palindrome",
    starterCode: `package main

import "fmt"

func main() {
  // Print Palindrome or Not a palindrome for "racecar"
  fmt.Println("Not a palindrome")
}
`,
    hints: [
      "Compare the word against itself read in the opposite direction.",
      "Two indices moving toward the centre are enough — you do not need to build a second string.",
      "Walk one index from the start and one from the end, comparing characters until they meet.",
    ],
  },
  {
    id: "ruby-count-vowels",
    title: "Count the Vowels",
    difficulty: "medium",
    language: "ruby",
    category: "Strings",
    tags: ["strings", "iteration", "counting"],
    estimatedMinutes: 15,
    description:
      'Count the vowels (a, e, i, o, u) in the word "programming" and print the total.',
    expectedOutput: "3",
    starterCode: `word = "programming"
count = 0

# Count the vowels in word
puts count
`,
    hints: [
      "Which letters in this word should increase your count?",
      "Inspect each character and decide whether it belongs to the vowel set.",
      "The word has three vowel characters. Walk it once, testing membership before incrementing.",
    ],
  },
  {
    id: "php-largest-number",
    title: "Largest Number",
    difficulty: "medium",
    language: "php",
    category: "Arrays",
    tags: ["arrays", "comparison", "loops"],
    estimatedMinutes: 15,
    description: "Print the largest value in the array [3, 9, 4].",
    expectedOutput: "9",
    starterCode: `<?php
$numbers = [3, 9, 4];
$largest = 0;

// Print the largest number
echo $largest . "\\n";
`,
    hints: [
      "What should the starting value be before you look at any number?",
      "Compare each value with the biggest one seen so far.",
      "Update the stored maximum whenever you meet a larger value, then print it once.",
    ],
  },
  {
    id: "typescript-fizzbuzz",
    title: "FizzBuzz",
    difficulty: "medium",
    language: "typescript",
    category: "Loops",
    tags: ["loops", "conditionals", "modulo"],
    estimatedMinutes: 20,
    description:
      "Print the first five FizzBuzz values, one per line, starting at 1. Use Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for multiples of both.",
    expectedOutput: "1\n2\nFizz\n4\nBuzz",
    starterCode: `for (let number = 1; number <= 5; number += 1) {
  // Print the FizzBuzz value for this number
  console.log(number);
}
`,
    hints: [
      "Which numbers from 1 through 5 are multiples of 3 or 5?",
      "A number divisible by both 3 and 5 needs a different label than either one alone.",
      "Test divisibility by 15 first, then 3, then 5, and otherwise print the number.",
    ],
  },
  {
    id: "rust-two-sum",
    title: "Two Sum",
    difficulty: "hard",
    language: "rust",
    category: "Arrays",
    tags: ["arrays", "hashmaps", "indices"],
    estimatedMinutes: 35,
    description:
      "From [2, 7, 11, 15], print the two indices whose values add up to 9, separated by a single space. There is exactly one answer.",
    expectedOutput: "0 1",
    starterCode: `fn main() {
    // Print the two indices for target 9
    println!("?");
}
`,
    hints: [
      "For each value, what partner value would complete the target?",
      "Remember values you have already passed, along with where they live.",
      "A map from value to index lets you check for the partner before moving on.",
    ],
  },
  {
    id: "python-balanced-brackets",
    title: "Balanced Brackets",
    difficulty: "hard",
    language: "python",
    category: "Stacks",
    tags: ["stacks", "strings", "validation"],
    estimatedMinutes: 30,
    description:
      'Given the bracket string "{[()]}", print "Balanced" if every opening bracket is closed in the correct order, otherwise print "Unbalanced".',
    expectedOutput: "Balanced",
    starterCode: `brackets = "{[()]}"

# Print Balanced or Unbalanced
print("Unbalanced")
`,
    hints: [
      "What is the most recent opening bracket you have seen but not yet closed?",
      "The most recent opener is always the first one that must be closed — a stack models that.",
      "Push openers; when a closer arrives, check it matches the top before popping. The stack must end empty.",
    ],
  },
  {
    id: "go-word-frequency",
    title: "Word Frequency",
    difficulty: "hard",
    language: "go",
    category: "Maps",
    tags: ["maps", "counting", "strings"],
    estimatedMinutes: 35,
    description:
      'For the sentence "the quick the fox", find the most frequent word and print it followed by its count, separated by a single space.',
    expectedOutput: "the 2",
    starterCode: `package main

import "fmt"

func main() {
  // Print the most frequent word and its count
  fmt.Println("?")
}
`,
    hints: [
      "Count how often each word appears before deciding which one wins.",
      "You need two things: a tally per word, and the best tally seen so far.",
      "Store counts in a map, then scan its entries comparing each count with the current best.",
    ],
  },
];

/**
 * Return every challenge in shelf order.
 * @returns {Promise<Array<object>>}
 */
export async function getChallenges() {
  return MOCK_CHALLENGES;
}

/**
 * Return one challenge or null when the id is unknown.
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getChallengeById(id) {
  if (typeof id !== "string") {
    return null;
  }

  return MOCK_CHALLENGES.find((challenge) => challenge.id === id) ?? null;
}

export const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

export const LANGUAGES = [
  "python",
  "javascript",
  "java",
  "c",
  "cpp",
  "go",
  "ruby",
  "php",
  "typescript",
  "rust",
];