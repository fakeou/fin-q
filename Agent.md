### Dexter 
一个基于开源项目dexter 的金融分析系统，以对话形式实现分析美股，加密货币等标的
Dexter GitHub仓库：https://github.com/virattt/dexter?tab=readme-ov-file#-how-to-install

### 实现功能
- 在当前文件夹下面存储 前端加后端的 monorepo 项目，后端使用nodeJS+postgresql实现。
- 前端展示对话，用户进入需要输入用户名，然后展示常规对话框，类似gemini和deepseek等AI对话形式，当前不需要长期记忆存储，默认使用dexter 的短期存储就行。
- 后端需要运行dexter，然后将前端的内容转发给dexter，再把 dexter 返回的内容发送给前端展示 

### 步骤
- 配置和运行dexter项目，验证是否可回复
- 开发前端页面
- 开发后端转发功能，或者前端直接对接dexter