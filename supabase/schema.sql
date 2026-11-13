-- HexBit schema — challenges, users, progress
--
-- Conventions used across the app:
--   * Challenge identity is the SLUG (matches challengeId in pages/api/run.js
--     and the keys of data/fallback.json), not a uuid.
--   * userId may be a uuid or a localStorage anonymous id, so progress.user_id
--     is plain text with no FK.
--   * API routes (pages/api/progress.js) write with SUPABASE_SERVICE_ROLE_KEY,
--     which bypasses RLS. The policies below are deliberately permissive so the
--     frontend can also read challenges / progress directly with the anon key.
--     Tighten them before any real deployment.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  language text not null default 'javascript',
  difficulty text not null default 'easy',
  starter_code text not null default '',
  expected_output text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'Guest',
  created_at timestamptz not null default now()
);

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  challenge_id text not null, -- challenge slug, e.g. "reverse-string"
  passed boolean not null default false,
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists progress_user_idx on progress (user_id);

-- ---------------------------------------------------------------------------
-- Row level security (demo-permissive)
-- ---------------------------------------------------------------------------

alter table challenges enable row level security;
alter table users enable row level security;
alter table progress enable row level security;

drop policy if exists "challenges readable by everyone" on challenges;
create policy "challenges readable by everyone"
  on challenges for select using (true);

drop policy if exists "users readable by everyone" on users;
create policy "users readable by everyone"
  on users for select using (true);

drop policy if exists "progress readable by everyone" on progress;
create policy "progress readable by everyone"
  on progress for select using (true);

drop policy if exists "progress writable by everyone (demo)" on progress;
create policy "progress writable by everyone (demo)"
  on progress for insert with check (true);

drop policy if exists "progress updatable by everyone (demo)" on progress;
create policy "progress updatable by everyone (demo)"
  on progress for update using (true);

-- ---------------------------------------------------------------------------
-- Seed data (idempotent — safe to re-run)
-- ---------------------------------------------------------------------------

insert into challenges (slug, title, description, language, difficulty, starter_code, expected_output)
values
  ('reverse-string',
   'Reverse a String',
   'Given a string, print it reversed. For example, the string "hello" should print "olleh".',
   'javascript', 'easy',
   'function reverseString(s) {
  // Print the reversed version of s
}

reverseString("hello");
',
   'olleh'),
  ('fizzbuzz',
   'FizzBuzz (1 to 5)',
   'For each number from 1 to 5, print the number — except print "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for multiples of both 3 and 5.',
   'javascript', 'easy',
   'for (let i = 1; i <= 5; i++) {
  // Print i, or "Fizz" / "Buzz" / "FizzBuzz"
}
',
   E'1\n2\nFizz\n4\nBuzz'),
  ('palindrome-check',
   'Palindrome Check',
   'Given a word, print "true" if it reads the same forwards and backwards (ignoring case), otherwise print "false". Check the word "racecar".',
   'javascript', 'easy',
   'function isPalindrome(word) {
  // Return true or false, ignoring case
}

console.log(isPalindrome("racecar"));
',
   'true'),
  ('count-vowels',
   'Count Vowels',
   'Count how many vowels (a, e, i, o, u) are in a word and print the number. Check the word "programming".',
   'javascript', 'easy',
   'function countVowels(word) {
  // Return the number of vowels in word
}

console.log(countVowels("programming"));
',
   '3'),
  ('sum-even-numbers',
   'Sum of Even Numbers',
   'Given an array of numbers, print the sum of only the even numbers. For [1, 2, 3, 4, 5, 6] the answer is 12.',
   'javascript', 'easy',
   'function sumEvenNumbers(numbers) {
  // Return the sum of the even numbers in the array
}

console.log(sumEvenNumbers([1, 2, 3, 4, 5, 6]));
',
   '12'),
  ('two-sum',
   'Two Sum',
   'Given an array of numbers and a target sum, print the indices of the two numbers that add up to the target, separated by a space. Exactly one solution exists. For [2, 7, 11, 15] with target 9, the answer is "0 1".',
   'javascript', 'medium',
   'function twoSum(nums, target) {
  // Return [index1, index2] of the two numbers that add up to target
}

const [i, j] = twoSum([2, 7, 11, 15], 9);
console.log(i + " " + j);
',
   '0 1'),
  ('factorial',
   'Factorial',
   'Given a number n, print its factorial (n! = 1 × 2 × ... × n). The factorial of 0 is 1. Compute the factorial of 5.',
   'javascript', 'medium',
   'function factorial(n) {
  // Return n factorial (n!)
}

console.log(factorial(5));
',
   '120')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  language = excluded.language,
  difficulty = excluded.difficulty,
  starter_code = excluded.starter_code,
  expected_output = excluded.expected_output;

-- Single demo user (no auth system). Grab its id after seeding if you want to
-- join progress rows to a real user; the frontend can also just send any
-- anonymous id string as userId.
insert into users (display_name)
values ('Demo User');
