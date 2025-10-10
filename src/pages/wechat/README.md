# 微信授权页面

## 路由说明

### `/wechat/access`

微信授权鉴权页面，处理用户访问权限验证。

## 功能说明

### 鉴权流程

1. **检查本地 Token**
   - 从 localStorage 读取已保存的 token

2. **验证 Token 有效性**
   - 如果存在 token，调用 `/api/auth/verify-token` 验证
   - Token 有效 → 直接跳转到 `/scroll-cache`
   - Token 无效/过期 → 继续下一步

3. **获取新 Token**
   - 调用 `/api/auth/wechat/access-token` 获取新 token
   - 可以传递 `code` 参数（从 URL query 获取）

4. **处理结果**
   - 成功：保存 token 到 localStorage，跳转到 `/scroll-cache`
   - 失败：跳转到 `/unauthorized` 无权访问页面

## 测试场景

### 场景 1：无 Token（首次访问）

访问：`http://localhost:3001/wechat/access`

**预期行为：**

1. 显示 "获取访问凭证..."
2. 自动获取新 token
3. 跳转到 scroll-cache 页面

### 场景 2：有有效 Token

**步骤：**

1. 先访问一次让系统存储 token
2. 再次访问 `/wechat/access`

**预期行为：**

1. 显示 "验证 Token 有效性..."
2. 验证通过
3. 直接跳转到 scroll-cache 页面

### 场景 3：Token 过期

**步骤：**

1. 手动在浏览器 Console 设置过期 token：
   ```javascript
   localStorage.setItem('ACCESS_TOKEN', 'expired')
   ```
2. 访问 `/wechat/access`

**预期行为：**

1. 验证 token 失败
2. 自动获取新 token
3. 跳转到 scroll-cache 页面

### 场景 4：获取 Token 失败

**步骤：**
访问：`http://localhost:3001/wechat/access?code=invalid`

**预期行为：**

1. 尝试获取 token 失败
2. 显示错误提示
3. 2秒后跳转到 `/unauthorized` 页面

## Mock 数据说明

### 验证 Token

**请求：** `GET /api/auth/verify-token`

**响应：**

- 有效 token：返回 `{ code: 0, data: { valid: true } }`
- 过期/无效：返回 `{ code: 401, data: { valid: false } }`

### 获取 Token

**请求：** `POST /api/auth/wechat/access-token`

**参数：** `{ code?: string }`

**响应：**

- 成功：`{ code: 0, data: { token: 'xxx', expires_in: 7200 } }`
- 失败（code='invalid'）：`{ code: 400, data: null }`

## 页面特性

### 加载动画

- 使用 Vant Loading 组件
- 渐变背景色
- 毛玻璃效果卡片
- 脉冲动画图标

### 状态提示

- "正在验证身份..."
- "验证 Token 有效性..."
- "获取访问凭证..."
- "授权成功，即将跳转..."

### 错误处理

- 网络错误自动捕获
- Toast 提示错误信息
- 自动跳转到无权访问页面

## 无权访问页面

路由：`/unauthorized`

### 功能

- 显示错误图标和提示
- 列出可能的原因
- 提供"重新授权"按钮（跳转回 `/wechat/access`）
- 提供"返回上一页"按钮

### 设计

- 抖动动画提示
- 清晰的错误说明
- 友好的操作指引
