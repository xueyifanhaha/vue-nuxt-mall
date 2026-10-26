<script setup lang="ts">
import { NavBar, Form, Field, Button, showToast } from 'vant'
import { plainRequest } from '~/composables/request'
import type { LoginResult } from '#shared/types'

useSeoMeta({ title: '登录 - 拾光百货' })

// 已登录访问登录页会被 guest middleware 跳回首页
definePageMeta({ middleware: 'guest' })

// guest middleware 已保证走到这里必然未登录
const route = useRoute()
const redirect = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') ? r : '/'
})

const form = ref({ username: '', password: '' })
const submitting = ref(false)

async function onSubmit() {
  if (submitting.value) {
    return
  }
  submitting.value = true
  try {
    const data = await plainRequest<LoginResult>('/api/login', {
      method: 'POST',
      body: { username: form.value.username, password: form.value.password },
    })
    useUserStore().setLogin(data)
    showToast({ message: '登录成功', type: 'success' })
    navigateTo(redirect.value, { replace: true })
  }
  catch {
    // 错误提示已由请求层统一 toast；登录的 401 是业务失败，不会触发踢回登录
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <NavBar title="登录" />

    <div class="login-hero">
      <div class="logo">
        拾
      </div>
      <p class="slogan">
        拾光百货 · 好物焕新
      </p>
    </div>

    <Form
      class="login-form"
      @submit="onSubmit"
    >
      <Field
        v-model="form.username"
        name="username"
        label="账号"
        placeholder="请输入账号"
        :rules="[{ required: true, message: '请输入账号' }]"
      />
      <Field
        v-model="form.password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请输入密码' }]"
      />
      <div class="submit-wrap">
        <Button
          round
          block
          type="primary"
          native-type="submit"
          :loading="submitting"
        >
          登录
        </Button>
      </div>
      <p class="hint">
        演示账号：demo / 123456
      </p>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.login {
  min-height: 100dvh;
  background: var(--c-bg);
}

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0 28px;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 20px;
    font-size: 34px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, var(--c-accent), var(--c-primary));
    box-shadow: var(--shadow-float);
  }

  .slogan {
    margin: 14px 0 0;
    font-size: 14px;
    color: var(--c-muted);
    letter-spacing: 2px;
  }
}

.login-form {
  margin: 0 16px;
  padding: 8px 12px 20px;
  border-radius: 14px;
  background: var(--c-card);
  box-shadow: var(--shadow-card);

  .submit-wrap {
    padding: 16px 8px 0;
  }

  .hint {
    margin: 12px 0 0;
    text-align: center;
    font-size: 12px;
    color: var(--c-muted);
  }
}

:deep(.van-field__label) {
  color: var(--c-ink);
}
</style>
