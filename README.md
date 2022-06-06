# pixi-slotmachine
Small slot machine game made with PixiJS

You can modify the initial Reels settings by modifying data.js file. 
For example:
```
    matrix: [
        [0, 0, 0, 0, 0, 0], // this represents the first Reel's symbols bottom-to-top
        [1, 1, 1, 1, 1, 1], // this represents the 2nd Reel from the left bottom-to-top
        [2, 2, 2, 2, 2, 2], // and so on
        [3, 3, 3, 3, 3, 3],
        [4, 4, 4, 4, 4, 4],
    ],
```

You can also modify the winning amounts for each type of winning, by modifying the 'winnings' array.
The array is 0-indexed with index 0 is the winning for 1x line match, index 1 is for 2x, and so on, and the last one is for the jackpot winning. 
