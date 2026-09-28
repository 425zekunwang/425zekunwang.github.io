---
title: "使用FastAPI与aiohttp进行SSE响应开发"
description: "今年随着ChatGPT的爆火，也带火了一种前后端数据通信模式，使用SSE，可以让服务端一边生成内容，一边将数据返回给客户端，这样客户端可以不用等待服务端将内容全部生成。本文介绍如何在FastAPI中使用这种SSE方式返回数据，…"
pubDate: "2023-08-22T19:32:00"
categories: [硬知识推演]
tags: [KevinYang]
draft: false
---
> 作者：KevinYang　|　赞同 18　|　评论 3　|　[原文](https://zhuanlan.zhihu.com/p/651676361)

今年随着ChatGPT的爆火，也带火了一种前后端数据通信模式，使用SSE，可以让服务端一边生成内容，一边将数据返回给客户端，这样客户端可以不用等待服务端将内容全部生成。本文介绍如何在FastAPI中使用这种SSE方式返回数据，并且使用requests和aiohttp这两个第三方库调用这种SSE接口并且展示数据。

安装fastapi与uvicorn

```
pip install fastapi
pip install uvicorn
```

启动fastapi测试接口

```
from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

使用命令 `uvicorn server:app` 来启动服务，访问 `http://127.0.0.1:8000/` 会得到`{"message": "Hello World"}` 的json 响应即可。

### 添加 SSE 响应支持

sse\_starlette是一个扩展，可以很方便的生成SSE响应流， 使用`pip install sse-starlette` 来安装这个包。

在sse\_starlette.sse中有个EventSourceResponse类，这个类可以响应SSE。

```
from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse
import asyncio

app = FastAPI()

@app.get("/")
async def root(request: Request):
    async def event_generator(request: Request):
        res_str = "七夕情人节即将来临，我们为您准备了精美的鲜花和美味的蛋糕"
        for i in res_str:
            if await request.is_disconnected():
                print("连接已中断")
                break
            yield {
                "event": "message",
                "retry": 15000,
                "data": i
            }

            await asyncio.sleep(0.1)
    g = event_generator(request)
    return EventSourceResponse(g)
```

EventSourceResponse类可以传入异步生成器(generator)，这里为什么要传一个生成器呢？ 由于采用SSE响应的数据一般是一点一点的返回给客户端，不是一次性的返回，像上面的代码，EventSourceResponse对象每次从g这个生成器中获取到数据，再将数据组装成sse的标准格式。

### SSE的标准格式

理论上作为SSE响应，我们可以任意的定义数据字段和值，但是一般情况下，为了和前端数据兼容，我们会用以下格式定义SSE响应内容。

```
event: message\r\ndata: \xe4\xb8\x83\r\nretry: 15000\r\n\r\n
event: message\r\ndata: \xe5\xa4\x95\r\nretry: 15000\r\n\r\n
```

1.  event: 表示事件，一般为message，如果有错误的话，也可以设置为error。message和error在前端会分别触发onmessage或onerror事件。
2.  retry: 重试时间，当出错以后，或者event为error时，后端可以定义这个时间，让客户端在retry时间后进行重试，单位是毫秒。
3.  data: 具体的数据。

这些字段之间使用`\r\n` 分割，每个sse数据使用两个`\r\n`， 也就是数据结尾处是两个`\r\n`。

当然这个不是必须的，只是一种标准，尤其是前端调用的时候，会对event值有一些不同的处理逻辑。最好统一下标准。

### Python 客户端接收数据

在使用Python调用接口时，使用最多的库为 requests库，异步库使用aiohttp比较多，我分别使用这两个库进行演示。

### 使用 requests 库调用接口得到SSE响应。

```
import requests

def test():
    url = r"http://127.0.0.1:8000/"
    headers = {'Content-Type': 'text/event-stream'}
    response = requests.get(url, headers=headers, stream=True)
    for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
        print(chunk)

if __name__ == '__main__':
    test()
```

这段代码中使用了 `response = requests.get(url, headers=headers, stream=True)` 来获取sse的内容，这里有一个比较重要的参数，`stream=True`， 使用了这个参数以后才可以达到SSE输出的效果。这里的header可以设置也可以不设置。

之后调用`response.iter_content()` 函数来打印数据。

chunk\_size: 默认为1，正常情况下我们要设置一个比较大的值，否则获取到一个字节数据就会走到下面的处理逻辑。 decode\_unicode: iter\_content() 函数遍历的数据是bytes类型的，这个参数可以控制是否将bytes转为str。

注意，这里的chunk即使被转换为字符串，也不是json格式的，我们看到服务端返回的数据像是一个json格式的：

```
yield {
    "event": "message",
    "retry": 15000,
    "data": i
}
```

但客户端得到的中下面的这样的格式，如果客户端想要转为json，需要再单独处理一下。

```
event: message
data: 七
retry: 15000

event: message
data: 夕
retry: 15000

event: message
data: 情
retry: 15000
```

### 使用aiohttp调用接口获取SSE返回。

aiohttp 作为异步调用接口常用的库，使用它调用SSE响应也很方便的。

```
async def test():
    headers = {'Content-Type': 'text/event-stream'}
    sseresp = aiohttp.request("GET", r"http://127.0.0.1:8000/", headers=headers)
    async with sseresp as r:
        async for chunk in r.content.iter_any():
            print(chunk.decode())

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test())
```

先使用`aiohttp.request("GET", r"http://127.0.0.1:8000/", headers=headers)` 构造一个请求对象，注意这里没有requests库中的`stream=True` 参数，如果加了会报错！之后开始遍历数据，注意这里是用的`async with` 和 `async for r.content.iter_any()`，这里一定要调用`r.content.iter_any()` 方法，否则达不到SSE的效果。

这里也没有像requests库中的`decode_unicode=True` 参数，所以需要客户端自己来decode数据。

### FastAPI使用POST接收参数

FastAPI 本身在处理SSE请求与响应时，GET和POST方法是都支持的。我们来看一下POST方法。

```
from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse
import asyncio
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    message: str

@app.post("/sse")
async def indexpost(msg: Message, req: Request):
    async def event_generator(request: Request):
        res_str = msg.message
        for i in res_str:
            if await request.is_disconnected():
                print("连接已中断")
                break
            yield {
                "event": "message",
                "retry": 15000,  # milisecond
                "data": i
            }

            await asyncio.sleep(0.1)

    return EventSourceResponse(event_generator(req))
```

代码和上文的GET很像，只不过在GET方法中，是使用的默认的一句话，“七夕情人节即将来临，我们为您准备了精美的鲜花和美味的蛋糕”，而这里是由客户端通过参数传过来。

我们再来使用aiohttp来使用POST方法调用一下接口。

```
import aiohttp
import asyncio
import json

async def test_post():
    headers = {'Content-Type': 'application/json'}
    data = {"message": "七夕情人节快乐！"}
    sseresp = aiohttp.request("POST", r"http://127.0.0.1:8000/sse", headers=headers, data=json.dumps(data))
    async with sseresp as r:
        async for chunk in r.content.iter_any():
            print(chunk.decode())

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_post())
```

注意这里的headers就一定要设置了。

### 前端通过POST方式调用SSE接口

一般的浏览器是支持SSE调用的

```
const eventSource = new EventSource('http_api_url', { withCredentials: true })
```

上面也有提到SSE响应数据的标准格式也是为了兼容这里的前端浏览器调用，但是这里的前端调用有个比较麻烦的问题是，只能使用GET方法，有个开源项目，是Azure的，可以让前端使用POST方式调用，有兴趣的可以尝试一下。

[https://github.com/Azure/fetch-event-source](https://github.com/Azure/fetch-event-source)
