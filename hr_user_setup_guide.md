# HR 用户设置指南

## 方法 1：通过 Supabase Dashboard（最简单）

### 步骤：
1. 登录 Supabase Dashboard
2. 进入 **Authentication** > **Users**
3. 点击 **Add user** 或 **Invite user**
4. 填写信息：
   - **Email**: `hr@yourcompany.com`（或你想要的邮箱）
   - **Password**: 设置一个安全密码
   - **Auto Confirm User**: ✓ 勾选（这样用户不需要邮箱验证）
5. 点击 **Create user** 或 **Send invitation**

### 验证 HR 用户：
- HR 用户**不应该**在 `crews` 表中有记录
- 登录后会自动跳转到 `/hr/dashboard`
- 可以访问所有 HR 页面（salary, run, payslips, crews, admin）

---

## 方法 2：通过 SQL（需要 service_role 权限）

如果你有 service_role key，可以在 SQL Editor 中运行：

```sql
-- 注意：这需要 service_role key，不是 anon key
-- 通常不建议在前端代码中使用 service_role key

SELECT auth.admin_create_user(
  '{
    "email": "hr@example.com",
    "password": "SecurePassword123!",
    "email_confirm": true,
    "user_metadata": {
      "role": "hr"
    }
  }'::jsonb
);
```

---

## 方法 3：创建用户后更新元数据

如果用户已经创建，可以更新用户元数据：

1. 在 **Authentication** > **Users** 中找到用户
2. 复制用户的 **UUID**
3. 在 SQL Editor 中运行（替换 `USER_ID_HERE`）：

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'hr'
)
WHERE id = 'USER_ID_HERE';
```

---

## 重要提示：

1. **HR 用户 vs 员工用户**：
   - HR 用户：不在 `crews` 表中，可以访问所有 HR 功能
   - 员工用户：在 `crews` 表中有记录，只能访问员工页面

2. **Admin 用户**：
   - Email 包含 "admin" 或以 "admin@" 开头
   - 或 `user_metadata.role === 'admin'`
   - 登录后跳转到 `/admin`

3. **测试 HR 用户**：
   - 使用创建的邮箱和密码登录
   - 应该自动跳转到 `/hr/dashboard`
   - 左侧导航栏应该显示 HR 菜单

---

## 推荐流程：

1. 使用 **方法 1**（Dashboard）创建用户
2. 确保该用户**不在** `crews` 表中
3. 测试登录，验证跳转到 HR dashboard
4. 如果需要，使用 **方法 3** 更新用户元数据

