# 修复步骤（一步一步来）

## 错误信息
`column c.basic_salary does not exist`

## 原因
数据库视图 `payslip_detail_view` 仍在使用 `crews` 表，但 `crews` 表已经没有 `basic_salary` 字段了。

## 解决方法

### 方法 1：查看并修改现有视图（推荐）

1. **在 Supabase SQL Editor 中运行**：
   ```sql
   SELECT pg_get_viewdef('payslip_detail_view', true);
   ```

2. **复制完整的输出结果**（会是一个完整的 CREATE VIEW 语句）

3. **在文本编辑器中打开复制的 SQL**，查找并替换：
   - 找到：`FROM crews c` 或 `FROM crews`
   - 替换为：`FROM crews_current c` 或 `FROM crews_current`

4. **在 SQL 前面加上**：
   ```sql
   DROP VIEW IF EXISTS payslip_detail_view CASCADE;
   
   -- 然后粘贴修改后的 CREATE VIEW 语句
   ```

5. **执行整个 SQL 语句**

### 方法 2：如果视图定义太复杂

如果视图定义很复杂，你可以：

1. 运行 `SELECT pg_get_viewdef('payslip_detail_view', true);`
2. **把完整的输出发给我**，我会帮你生成修复后的 SQL

### 检查是否修复成功

修复后，运行：
```sql
SELECT * FROM payslip_detail_view LIMIT 1;
```

如果没有错误，说明修复成功。然后刷新浏览器页面即可。

