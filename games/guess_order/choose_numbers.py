"""
Generate n distinct integers in arrival order using a nonuniform random
permutation followed by recursive, uniformly sampled value assignments.

First, construct a permutation of arrival indices 0..n-1. In each block
of size m > 1, sample a position using cdfs[m], place the next arrival
index there, then recursively fill the left block followed by the right.
A singleton receives the next index directly. Thus cdfs[m][j] is the
probability of selecting a position at or before relative position j.

Next, assign values within the inclusive bounds [low, high]. In each
nonempty block, assign its earliest arrival a uniformly random integer
from [lower + margin, upper - margin], where margin = 2**(m-1) - 1.
Recursively assign the left block within [lower, value-1] and the right
block within [value+1, upper]. This reserves enough space on either side
for any split under the same rule.

Return the values in arrival order; their ascending order follows the
sampled permutation. Individual draws are conditionally uniform within
their permitted intervals, but final sequences need not be uniform.

Requires valid position CDFs for sizes 2..n and at least 2**n - 1 integers
in [low, high]. With bounds [1, 99], n must be at most 6.

Example:
    For n=5, a sampled permutation (1, 2, 0, 4, 3) can yield arrival values
    [27, 13, 20, 70, 50]. The first value is drawn from [16, 84]; subsequent
    draws follow the recursive blocks. Reading the values in permutation
    order gives [13, 20, 27, 50, 70].
"""

import random

probabilites_CDFs = {
    2: [1/2, 1],
    3: [2/5, 3/5, 1],
    4: [5/14, 7/14, 9/14, 1],
    5: [14/42, 19/42, 23/42, 28/42, 1],
    6: [42/132, 56/132, 66/132, 76/132, 90/132, 1],
}

def order(n=6, cdfs=probabilites_CDFs):
    if n not in [0, 1, 2, 3, 4, 5, 6]: 
        raise ValueError(f"Undefined behaviour for {n=} not in [0, 1, 2, 3, 4, 5, 6]")

    result = [None] * n
    numbers = iter(range(n))

    def fill(size, shift):
        if size == 0:
            return

        if size == 1:
            result[shift] = next(numbers)
            return

        p = random.random()
        offset = next(i for i, val in enumerate(cdfs[size]) if val > p)
        idx = shift + offset

        result[idx] = next(numbers)
        fill(offset, shift)                       # Left block
        fill(size - offset - 1, idx + 1)          # Right block

    fill(n, 0)
    return tuple(result)

def numbers_for_shuffle(permutation, low=1, high=99):
    """Turn a shuffle into random numbers, returned in arrival order."""
    n = len(permutation)

    if sorted(permutation) != list(range(n)):
        raise ValueError("Expected a permutation of 0..n-1")

    if high - low + 1 < 2**n - 1:
        raise ValueError(
            f"Your margin rule requires at least {2**n - 1} available numbers"
        )

    numbers = [None] * n

    def fill(start, stop, lower, upper):
        size = stop - start
        if size == 0:
            return

        # The smallest label is the first arrival in this block.
        idx = min(range(start, stop), key=lambda i: permutation[i])

        margin = 2**(size - 1) - 1
        value = random.randint(lower + margin, upper - margin)
        numbers[permutation[idx]] = value

        fill(start, idx, lower, value - 1)
        fill(idx + 1, stop, value + 1, upper)

    fill(0, n, low, high)
    return numbers

def main(n):
    permutation = order(n)
    numbers = numbers_for_shuffle(permutation)
    return numbers
