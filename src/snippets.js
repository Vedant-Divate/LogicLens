export const snippets = [
  {
    name: "None",
    code: `// Write your JavaScript code here...`
  },
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
}`
  },
  {
    name: "Sorting (Selection Sort)",
    code: `let arr = [29, 10, 14, 37, 13];
for (let i = 0; i < arr.length - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[j] < arr[minIdx]) {
      minIdx = j;
    }
  }
  let temp = arr[i];
  arr[i] = arr[minIdx];
  arr[minIdx] = temp;
}`
  },
  {
    name: "Sorting (Insertion Sort)",
    code: `let arr = [9, 5, 1, 4, 3];
for (let i = 1; i < arr.length; i++) {
  let key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j = j - 1;
  }
  arr[j + 1] = key;
}`
  },
  {
    name: "Sorting (Quick Sort)",
    code: `let arr = [10, 80, 30, 90, 40, 50, 70];

function partition(low, high) {
  let pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      let temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  let temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  return i + 1;
}

function quickSort(low, high) {
  if (low < high) {
    let pi = partition(low, high);
    quickSort(low, pi - 1);
    quickSort(pi + 1, high);
  }
}

quickSort(0, arr.length - 1);`
  },
  {
    name: "Sorting (Merge Sort)",
    code: `let arr = [38, 27, 43, 3, 9, 82, 10];

function merge(left, mid, right) {
  let L = arr.slice(left, mid + 1);
  let R = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  while (i < L.length && j < R.length) {
    if (L[i] <= R[j]) {
      arr[k++] = L[i++];
    } else {
      arr[k++] = R[j++];
    }
  }
  while (i < L.length) arr[k++] = L[i++];
  while (j < R.length) arr[k++] = R[j++];
}

function mergeSort(left, right) {
  if (left >= right) return;
  let mid = Math.floor((left + right) / 2);
  mergeSort(left, mid);
  mergeSort(mid + 1, right);
  merge(left, mid, right);
}

mergeSort(0, arr.length - 1);`
  },
  {
    name: "Searching (Linear Search)",
    code: `let arr = [10, 23, 45, 70, 11, 15];
let target = 70;
let foundIndex = -1;

for (let i = 0; i < arr.length; i++) {
  if (arr[i] === target) {
    foundIndex = i;
    break;
  }
}
console.log("Found at index:", foundIndex);`
  },
  {
    name: "Searching (Binary Search)",
    code: `let arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
let target = 23;
let left = 0;
let right = arr.length - 1;
let foundIndex = -1;

while (left <= right) {
  let mid = Math.floor((left + right) / 2);
  
  if (arr[mid] === target) {
    foundIndex = mid;
    break;
  } else if (arr[mid] < target) {
    left = mid + 1;
  } else {
    right = mid - 1;
  }
}`
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