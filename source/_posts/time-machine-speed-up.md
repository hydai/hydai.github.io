---
title: 加速 macOS 的 Time Machine 備份速度
date: 2024-11-24 16:58:22
tags:
- macOS
- Time Machine
categories:
- Note
---

## 前言

macOS 的 Time Machine 是一個非常好用的備份工具，它曾經多次救援我人生的重要時刻。當時碩士論文寫到一半，macbook pro 直接壞掉，幸好有 Time Machine 的備份，讓我可以如期畢業。

但是隨著使用的容量越來越大，在備份的過程中，有時候會發現備份的速度變成異常緩慢，甚至出現要十幾個小時才能完成一次備份，尤其人在國外時深感危險。

在搜尋的時候發現其實世界上有一大堆人也有相同的問題，幾乎都有標準做法了`(/ω＼)`

<!-- more -->

## 解決方法

與其他的備份方式不同，Time Machine 有個隱藏的參數會將備份的速度限制在一個較低的數值，且相關的優先順序也是在較低的位置，因此如果不改變這個數值的話，Time Machine 的備份速度就會隨著積累的增加而變得越來越慢。

很遺憾的是，這個數值是隱藏的，因此我們需要透過終端機來修改這個數值。

打開終端機以後，輸入以下指令：

```bash
sudo sysctl debug.lowpri_throttle_enabled=0
```

這樣一來，Time Machine 的備份速度就會恢復到正常的速度了。

### 指令解釋
`sudo` 是因為我們需要透過 `sysctl` 進行系統參數的修改，而這個指令是需要 root 權限才能使用的。

`sysctl` 是一個在 Unix-like 的作業系統中專門用來讀取與修改內核參數的工具。

`debug.lowpri_throttle_enabled` 是一個參數，當這個參數為 1 時，Time Machine 的備份速度會被限制在一個較低的數值，當這個參數為 0 時，Time Machine 的備份速度就不再受到此限制。

`lowpri` 是 low priority 的縮寫，`throttle` 是節流閥的意思，表示限制流量，`enabled` 是啟用的意思，因此這個參數的意思就是啟用低優先順序的限制。

## 恢復原來的設定

上面的修改會在重新開機後被重置，因此即使忘記恢復原本的設定也沒關係，時間會解決一切。

若完成備份之後，還是想要馬上恢復成原本的設定，可以輸入以下指令：

```bash
sudo sysctl debug.lowpri_throttle_enabled=1
```

## 方便的別名

每次都需要輸入這麼長的指令也是很麻煩的，因此可以使用 `alias` 來建立一個別名，這樣就能用短短的指令做到同樣的事囉。

```bash
# 請在你的 .bashrc 或 .zshrc 中加入以下指令
alias tmspup='sudo sysctl debug.lowpri_throttle_enabled=0'
alias tmspdown='sudo sysctl debug.lowpri_throttle_enabled=1'
# 日後就能使用 tmspup 與 tmspdown 來快速的切換 Time Machine 的備份速度了
```

## Reference

* [How to Speed Up Your Time Machine Backups](https://www.howtogeek.com/843598/how-to-speed-up-your-time-machine-backups/)
