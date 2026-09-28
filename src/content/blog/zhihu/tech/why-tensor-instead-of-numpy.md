---
title: "为什么深度学习中要搞出 tensor 这种概念，而不是直接用 numpy 里的 array 呢？"
description: "我发现很多人没有说到重点，首先，数学上的 tensor 和编程上的（pytorch）内的 tensor 是两个概念。数学上的 tensor 是用来研究高维矩阵之间的一些表达方式和运算性质的（比如高维空间的度量如何更加通用的定义），pytorch 里面的 tensor 是一个数据结构，…"
pubDate: "2024-07-25T16:49:00"
updated: "2024-07-25T16:58:00"
categories: [硬知识推演]
tags: [锦恢]
draft: false
---
> 作者：锦恢　|　赞同 2212　|　评论 55　|　[原文](https://www.zhihu.com/question/598278407/answer/3573288190)

我发现很多人没有说到重点，首先，数学上的 tensor 和编程上的（pytorch）内的 tensor 是两个概念。数学上的 tensor 是用来研究高维矩阵之间的一些表达方式和运算性质的（比如高维空间的度量如何更加通用的定义），pytorch 里面的 tensor 是一个数据结构，不严谨且不恰当地讲，这个 class 是 numpy 的 np.ndarray 的子类。

请阁下备好红茶，然后回答我这么几个问题，当然我也附上了答案。

---

**深度学习框架最重要的是什么？**答：是自动求导系统。

**为什么要自动求导系统？**答：因为目前的损失函数的优化方法全都基于一阶梯度信息进行梯度下降。

**如何实现梯度的计算？**答：计算图。

因此，pytorch 的 tensor 和 numpy 最大的区别在于当你使用 tensor 进行加减乘除运算时，torch 后台会自动帮你构建出计算图，当你计算完成后，通过运算结果的 backward 函数反向传播后，你就可以得到一路上所有 `requires_grad=True` 的 tensor 的梯度了（必须是叶子节点）。因为这个过程中，每个 tensor 是计算图上的一个节点，在 HPC 或者 infra 工程师的语境中，我们更喜欢用 node 而非 tensor 来描述参与运算的单元。

具体的内部原理可以看我之前写的专栏，2024年了，计算图技术已经不是什么高深技术了：

[K的深度学习框架](https://www.zhihu.com/column/c_1486851133511995393)

用代码演示就是这个样子的，比如我们计算一个标量乘法的运算：

$c = a \times b,\quad a,b,c\in\mathbb R\\$利用 tensor 的计算图，我们就可以只用一个 `backward` 函数就可以 **在没有学习过实数域微分的情况** 下不负责任地就计算出 $\frac{\partial c}{\partial a},\frac{\partial c}{\partial b}$ ：

```
import torch

a = torch.tensor(1., requires_grad=True)
b = torch.tensor(2., requires_grad=True)
c = a * b

c.backward()

print(a.grad)
print(b.grad)
```

更加复杂的计算，更加复杂的数域都可以用这套计算图完成，简直就是 silver bullet。20年前搞深度学习的那帮人可没有这么好的条件，他们当年都要手动完成 $\frac{\partial c}{\partial a},\frac{\partial c}{\partial b}$ 的闭式解求解，然后写成一个个写死的 grad\_fn 函数。

---

那么回到最初的问题，tensor 和 numpy 的区别是什么？主要在于两点：

1.  **tensor 在运算时会构建计算图，numpy 不会**。
2.  **tensor 的每一种类型的运算都实现了对应OP的梯度函数**（也就是 $\frac{\partial c}{\partial a},\frac{\partial c}{\partial b}$ 的闭式解编程实现`a.grad_fn`，这玩意儿编写可是一个体力活，特别是要适配 GPU）

当然，你说我用 tensor 就是进行普通矩阵运算，不要什么计算图，可以吗？当然可以，你套上一个 no\_grad() 的 上下文就 bingo 了：

```
with torch.no_grad():
    # 此上下文中将不会生成计算图

```

> 反向计算很废的 =\_=，不仅要把 grad\_fn 一个个写出来，你还得考虑该死的广播运算呀，运算溢出如何处理呀。我开发自动求导系统时最怕遇到指数函数了。。。

最后多提一句，除了上面的不同外，pytorch 的 tensor 的基础运算在底层也做了一点点的优化。具体表现为，在 CPU 上，比较大的三维数组的计算（比如爱因斯坦乘），tensor 的速度显著优于 numpy。可以看我曾经给 CT 的 FBP 算法进行优化加速的博客：

[汇尘轩 - 锦恢的博客 | CT重建算法之 FBP 算法实现](https://kirigaya.cn/blog/article?seq=115)

而且 torch 的 tensor 还可以吃到 intel 的 mkldnn 驱动或者 nvidia 的 cuda 驱动的红利。这些都是一些数值计算上的优化差异了。

---

至于为什么这个领域的数组被叫成了 张量 tensor，楼上 [酱紫君](https://www.zhihu.com/people/GalAster)[​](https://www.zhihu.com/question/48509984) 的回答已经说得很到位了。毕竟，你们懂的，**人们总是需要通过附庸风雅或者叶公好龙之为来弥补自己脆弱的认同感和安全感**。MBTI 这种廉价的人格量表技术能如此流行也是大抵如此。

![](../images/4086ea12b476bdfe.jpg)
