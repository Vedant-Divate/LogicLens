export const snippets = [
  {
    name: "Arrays & Loops",
    code: `let arr = [10, 20, 30];
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum = sum + arr[i];
}
console.log("Total sum:", sum);`
  },
  {
    name: "Recursion (Factorial)",
    code: `function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);
}

let result = factorial(4);
console.log("Result:", result);`
  },
  {
    name: "Sorting (Bubble Sort)",
    code: `let arr = [5, 2, 8, 1, 3];
for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
    }
  }
}
console.log("Sorted:", arr);`
  },
  {
    name: "Data Structure (Linked List)",
    code: `let head = { val: 1, next: null };
head.next = { val: 2, next: null };
head.next.next = { val: 3, next: null };

let current = head;
while (current !== null) {
  console.log(current.val);
  current = current.next;
}`
  }
];