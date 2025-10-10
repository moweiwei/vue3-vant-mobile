import { defineMock } from 'vite-plugin-mock-dev-server'
import { builder } from '../util'

export default defineMock([
  {
    url: '/api/auth/login',
    delay: 500,
    body: () => {
      return {
        code: 0,
        data: {
          token: 'admin',
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/user/me',
    delay: 100,
    body: () => {
      return {
        code: 0,
        data: {
          uid: 1,
          name: 'admin',
          avatar: 'https://iconfont.alicdn.com/p/user/eZQFvSX6g8f1/f0d9fd95-a5f0-474d-98b0-d51e8450f2cf.png',
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/user/logout',
    delay: 500,
    body: () => {
      return {
        code: 0,
        msg: 'success',
      }
    },
  },
  {
    url: '/api/user/email-code',
    delay: 1000,
    body: () => {
      const code = '123456'
      return builder(code)
    },
  },
  {
    url: '/api/user/reset-password',
    delay: 1000,
    body: () => {
      const res = true
      return builder(res)
    },
  },
  {
    url: '/api/user/register',
    delay: 1000,
    body: () => {
      const res = true
      return builder(res)
    },
  },
  {
    url: '/api/auth/verify-token',
    delay: 500,
    body: ({ headers }) => {
      // 模拟 token 验证
      const token = headers['access-token'] || headers['Access-Token']

      if (token && token !== 'expired') {
        return {
          code: 0,
          data: {
            valid: true,
          },
          msg: 'Token 有效',
        }
      }

      // 模拟 token 过期
      return {
        code: 401,
        data: {
          valid: false,
        },
        msg: 'Token 已过期',
      }
    },
  },
  {
    url: '/api/auth/wechat/access-token',
    delay: 1000,
    body: ({ body }) => {
      // 模拟获取微信 access token
      const { code } = body || {}

      // 模拟成功场景
      if (code !== 'invalid') {
        return {
          code: 0,
          data: {
            token: `wechat_token_${Date.now()}`,
            expires_in: 7200,
          },
          msg: '获取 Token 成功',
        }
      }

      // 模拟失败场景
      return {
        code: 400,
        data: null,
        msg: '获取 Token 失败',
      }
    },
  },
])
