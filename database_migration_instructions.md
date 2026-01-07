# 数据库迁移指南：使用 crews_current 视图

## 概述

将所有数据库视图和函数从使用 `crews` 表改为使用 `crews_current` 视图，这样 `basic_salary` 会自动从 `crew_compensation` 表读取。

## 需要更新的数据库对象

1. **payslip_detail_view** - 视图
2. **run_payroll** - 存储函数
3. **run_payroll_preview** - 存储函数
4. 其他可能引用 `crews.basic_salary` 的视图、函数、触发器等

## 更新步骤

### 步骤 1：查看当前定义

在 Supabase SQL Editor 中运行以下查询来查看当前的定义：

```sql
-- 查看 payslip_detail_view 定义
SELECT pg_get_viewdef('payslip_detail_view', true);

-- 查看 run_payroll 函数定义
SELECT pg_get_functiondef('run_payroll'::regproc);

-- 查看 run_payroll_preview 函数定义
SELECT pg_get_functiondef('run_payroll_preview'::regproc);
```

### 步骤 2：复制定义并修改

对于每个对象：

1. **复制完整的定义**
2. **查找所有 `FROM crews` 或 `FROM crews c`**
3. **替换为 `FROM crews_current c`**（保持别名 `c` 不变）
4. **其他所有内容保持不变**

### 步骤 3：重新创建对象

```sql
-- 删除旧对象
DROP VIEW IF EXISTS payslip_detail_view CASCADE;
-- 或
DROP FUNCTION IF EXISTS run_payroll(text);

-- 粘贴修改后的定义并执行
CREATE OR REPLACE VIEW payslip_detail_view AS ...
-- 或
CREATE OR REPLACE FUNCTION run_payroll(...) AS ...
```

## 关键点

- ✅ **只替换表名**：`FROM crews` → `FROM crews_current`
- ✅ **保持别名**：继续使用 `c` 作为别名
- ✅ **字段名不变**：`c.basic_salary` 仍然可用，会自动从 `crew_compensation` 读取
- ✅ **前端代码不需要修改**：前端代码已经是正确的
- ❌ **不需要改变字段名**
- ❌ **不需要修改 SELECT 列表中的字段**

## 示例

**原来：**
```sql
FROM crews c
WHERE c.id = ...
```

**改成：**
```sql
FROM crews_current c
WHERE c.id = ...
```

然后 `c.basic_salary` 就可以正常工作了！

## 检查其他对象

运行以下查询来查找所有可能引用 `crews` 表的对象：

```sql
-- 查找所有引用 crews 的视图
SELECT schemaname, viewname, definition
FROM pg_views
WHERE definition LIKE '%crews%'
AND schemaname = 'public';

-- 查找所有引用 crews 的函数
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%crews%';
```






