---
title: "Android为什么不直接执行Linux的程序？而是自己搞一套？"
description: "Linux上的可执行文件格式叫做ELF，你大概可以理解为Windows的EXE。"
pubDate: "2025-11-22T04:32:00"
updated: "2025-11-25T15:26:00"
categories: [硬知识推演]
tags: [eechen]
draft: false
---
> 作者：eechen　|　赞同 588　|　评论 62　|　[原文](https://www.zhihu.com/question/20596433/answer/1975421350471550078)

Linux上的可执行文件格式叫做ELF，你大概可以理解为Windows的EXE。

实际上是Android一直都可以执行ELF程序，Android的系统（包括Linux内核和Dalvik/ART虚拟机），以及所有Android NDK编译构建的本地程序和库，比如Chrome浏览器和Chromium-based的WebView等，还有Android游戏使用的Unity引擎和UE引擎，全是ELF格式。

Android自己搞一套更多指的是Android App的开发，所有的App都要运行在Dalvik/ART这个运行时之上，也就是不管你开发什么应用，程序的入口都必须由Dalvik/ART执行。大概可以简单理解为，张三定制了一个Linux系统，里面只允许发布和运行JVM上的Java程序，不允许直接运行其他语言编写的程序，当然你在Java程序里运行Linux可执行文件或者JNI调用Linux共享库我也不拦你。ChromeOS和FirefoxOS（已成历史）这些也是这种模式，只是里面的应用被限制为要求使用Web技术构建，实际上都是Linux系统。

当然也有例外，比如你可以在adb shell里直接在命令行运行标准的Linux ELF程序，最典型的就是BusyBox这个小型的GNU/Linux工具集。

你甚至可以把树莓派Raspbian上的二进制程序打包依赖库后放到Android上跑。

更有甚者，可以把Nginx+PHP+MySQL这套Linux上的Web服务都部署到Android手机上，比如KSWeb这个Android App就是这么干的。

所以用Android手机还可以跑Minecraft的服务器，比如PocketMine这个项目，就是一个用PHP写的Minecraft服务器。

你觉得很抽象，但上面的全是事实。

PS：

否认Android是Linux系统，真的一点意义都没有。

Android不是GNU/Linux发行版，但Android是一个完完全全的Linux系统。

Android只是不用GNU的libc库，不代表GNU的libc库不能跑在Android上。

Android不用GNU的libc库，是协议上的风险问题，不是技术上的实现问题。

如果GNU的libc库不是LGPL/GPL授权，而是zlib之类的宽松授权，那Google大概率会直接使用glibc。

Android NDK以前一直用的都是GNU GCC的套件，后来才逐渐转移到LLVM/Clang上，更多地也是为了规避协议风险。

Google非常反感GPL及其相关协议，Google公司内部严禁使用AGPL协议的开源软件，并且联合OSI这种开源协议认证机构拒绝承认AGPL（就问你有没有美帝那味）。如果你不想Google等商业公司白嫖你的代码，使用AGPL授权是个非常好的反制手段。

那为什么Google等商业公司不去折腾协议更加宽松的BSD系统呢？因为BSD系统生态不好嘛。为什么生态不好，因为BSD协议宽松嘛。为什么GPL这边的GNU/Linux生态好，因为GPL保护了GNU/Linux生态嘛。

Android上使用的技术，几乎都可以轻易支持Linux，包括Android为闪存读写优化的文件系统F2FS，包括Android取代swap交换的zram内存压缩技术，这些所有GNU/Linux发行版都能直接使用。如果Linux内核不是GPL协议，那这些技术真可能就是Android独享了。而这些技术，跟其他系统比如iOS和Windows，生态上完全是生殖隔离的。
