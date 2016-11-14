---
title: 發 Pull Request 該注意的事情
date: 2016-08-03 22:06:22
tags:
- git
- Pull Request
- PR
categories:
- Note
---

## 0. 前言

在漫長的程式旅途中，我們很容易就使用到 Free software(如 gcc) 以及 
Open Source Project(如 Bootstrap) 。
身為用戶，我其實一直希望能為這些很棒的作品增加更多更棒的功能。

也許是身為工程師的浪漫吧，我很渴望能做出一款全世界都在用的軟體，
然後很自豪地說：「看呀，你在用的ＯＯＸＸ是我做的喔！」（燦笑）

而在這之前，我們可能更常碰到在使用 Open Source Project 的情況下遇到 Bug ，
或是想為其添加新功能。這時候，如果是在 GitHub 上頭，我們便會以 Pull Request 
的方式把自己的修改發過去給 upstream 希望他們能把這樣的增進給 Merge 進去。

不過先別急著在改完就馬上送過去，不然可能很容易會被無視或是當成小白喔！

<!-- more -->

## 1. 至少要測試過才發 Pull Request 過去喔

千萬不要把沒有測試過的 Code 就直接發 Pull Request 塞過去，
這個一定會被巴死，而且人家會覺得你腦袋壞掉OTZ

現在很多的 Project 都會串上 CI 當你發送 Pull Request 過去時，
便會驅動 CI 進行測試，如果你的程式碼根本沒有通過測試，那麼 Project 的 
maintainer 當然不會去幫你看囉。

也因此很容易就直接被忽略了。
而且這樣的行為可能會讓別人對你留下不是很好的印象喔！！


## 2. 符合人家的文化

正所謂家有家規、國有國法，當你想要為一個 Project 發送 Pull Request 的時候，
千萬要注意自己的 Coding Style 有沒有符合規範、命名的方式有沒有跟人家一致等等。

通常可以在人家的 Project 底下找到 CONTRIBUTING.md 或是 contributing guide ，
這裡面通常會記載很詳細的你要如何融入這個貢獻群的方式，
有些也會在這邊說明 Project 裡頭的 Coding Style 甚至是 Naming Style 喔！

如果沒有在 Project 中找到這些文化資訊的話，那麼就要利用自己 *敏銳* 的觀察力，
仔細的看一下該個 Project 裡面是怎麼樣的撰寫風格，然後盡量去符合 Code Owner 的
風格吧！


## 3. 要隨時跟想 merge 進去的 branch 保持同步

比如說今天你在 fork 過來的 Project 從他的 `develop` branch 拉出來一條 
叫做 `new_feature_A` 的 branch，準備為這個 Project 新增一個新功能 A。

在非常認真的撰寫程式碼後，你終於完成了這個新功能 A，並且想要把它貢獻回去原本的
Project 中，這時候你可能會想發一個 Pull Request(PR) 想把你的 `new_feature_A` 
branch merge 到原開發者的 `develop` 的 branch 上。

但是那條你原先拉出來的 `develop` branch 可能已經有了更多的 commit 或是 
merge 了許多的 PR。
於是你的 branch 跟原開發者的 branch 就會發生 conflict，沒辦法被原開發者使用自動
 merge，因為會被 conflict 的情況卡住。

當然這時候原開發者沒有義務幫你解決這個 conflict 的問題，如果你沒有自己處理好，
原開發者可能也會直接不理這個 PR 了。

因此隨時與自己想要貢獻回去的 branch 同步也是很重要的喔！

通常我個人的同步做法是這樣的：

```bash
git fetch upstream
git checkout new_feature_A # 切到自己開發的那條 branch 上
git rebase upstream/develop # 跟原開發者的 develop branch 做 rebase
```

不使用 git merge 跟 upstream 同步，而是用 rebase 的方式，
這樣可以保持整條 branch 的乾淨層度喔。

而到後來我自己很不喜歡看到 merge commit 這個點出現XD 
畢竟有時候太多的 merge commit 實在會讓整個圖不太好看。

所以我自己會盡量少用 `git pull` 或是 `git merge` 這兩個指令的話，
而是改用 `git pull --rebase` 跟 `git rebase` 來取代喔！


## 4. Squash commits 的重要性

平常我們在開發的時候，很常進行 commit ，雖然只是要完成一件事情，
可是卻花了好幾個 commit 來完成這件事。最常見的是下面這個模樣：

```text
commit 1: Add feature meow
commit 2: Fix typo
commit 3: Fix missing OO
commit 4: Fix bugs in feature meow
...
```

但是如果你要送上去的重點只有「Add feature meow」這件事情，我認為就應該只留下
表達出 「Add feature meow」 這件事的 commit log 就好，
這些細節(繁瑣)的過程留在 commit log 裡也沒有太大的好處。

這個時候我們就可以透過 `git rebase -i` 的方式來做 squash commits 讓我們的 
commit log 變得更乾淨。

至於要怎麼使用 `git rebase` 來做 squash 呢？就留待之後的文章再來好好解釋啦！

P.S. 本文是以個人的經驗撰寫而成，
如果缺漏或需更正之處，歡迎各位提出更多的建議喔OuO。
